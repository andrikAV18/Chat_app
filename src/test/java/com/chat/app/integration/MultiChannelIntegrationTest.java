package com.chat.app.integration;

import com.chat.app.dto.ChatMessageDTO;
import com.chat.app.model.MessageType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.util.concurrent.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class MultiChannelIntegrationTest {

    @LocalServerPort
    private int port;

    private WebSocketStompClient stompClient;

    @BeforeEach
    public void setup() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());
        stompClient.setInboundMessageSizeLimit(512 * 1024); // 512KB limit for client
    }

    private StompSession connect() throws Exception {
        String wsUrl = "ws://localhost:" + port + "/ws";
        return stompClient.connectAsync(wsUrl, new StompSessionHandlerAdapter() {
        }).get(5, TimeUnit.SECONDS);
    }

    @Test
    public void testMultiChannelIsolation() throws Exception {
        StompSession sessionA = connect();
        StompSession sessionB = connect();
        StompSession sessionC = connect();

        TestStompSessionHandler handlerA = new TestStompSessionHandler();
        sessionA.subscribe("/topic/general", handlerA);

        TestStompSessionHandler handlerB = new TestStompSessionHandler();
        sessionB.subscribe("/topic/random", handlerB);

        TestStompSessionHandler handlerC = new TestStompSessionHandler();
        sessionC.subscribe("/topic/general", handlerC);

        Thread.sleep(1000);

        ChatMessageDTO msgToGeneral = ChatMessageDTO.builder()
                .sender("UserA")
                .content("Hello General")
                .type(MessageType.CHAT)
                .build();

        sessionA.send("/app/chat/general/sendMessage", msgToGeneral);

        ChatMessageDTO receivedByC = handlerC.messages.poll(2, TimeUnit.SECONDS);
        ChatMessageDTO receivedByB = handlerB.messages.poll(100, TimeUnit.MILLISECONDS);

        assertNotNull(receivedByC, "User C in General should receive the message");
        assertEquals("Hello General", receivedByC.getContent());
        assertNull(receivedByB, "User B in Random should NOT receive the message");
    }

    @Test
    public void testChannelSwitching() throws Exception {
        StompSession session = connect();
        TestStompSessionHandler handler = new TestStompSessionHandler();

        StompSession.Subscription subGeneral = session.subscribe("/topic/general", handler);
        Thread.sleep(500);

        session.send("/app/chat/general/sendMessage",
                ChatMessageDTO.builder().sender("Me").content("Msg1").type(MessageType.CHAT).build());
        ChatMessageDTO msg1 = handler.messages.poll(2, TimeUnit.SECONDS);
        assertNotNull(msg1);
        assertEquals("Msg1", msg1.getContent());

        subGeneral.unsubscribe();
        session.subscribe("/topic/random", handler);
        Thread.sleep(500);

        session.send("/app/chat/general/sendMessage",
                ChatMessageDTO.builder().sender("Me").content("Msg2").type(MessageType.CHAT).build());
        ChatMessageDTO msg2 = handler.messages.poll(500, TimeUnit.MILLISECONDS);
        assertNull(msg2, "Should not receive General messages after unsubscribing");

        session.send("/app/chat/random/sendMessage",
                ChatMessageDTO.builder().sender("Me").content("Msg3").type(MessageType.CHAT).build());
        ChatMessageDTO msg3 = handler.messages.poll(2, TimeUnit.SECONDS);
        assertNotNull(msg3, "Should receive Random messages");
        assertEquals("Msg3", msg3.getContent());
    }

    @Test
    public void testDynamicAndSpecialCharChannels() throws Exception {
        StompSession session = connect();
        TestStompSessionHandler handler = new TestStompSessionHandler();

        String specialChannel = "dev-ops_v1.0"; // Special chars test
        session.subscribe("/topic/" + specialChannel, handler);
        Thread.sleep(500);

        ChatMessageDTO msg = ChatMessageDTO.builder().sender("Dev").content("Status OK").type(MessageType.CHAT).build();
        session.send("/app/chat/" + specialChannel + "/sendMessage", msg); // Send to special channel

        ChatMessageDTO received = handler.messages.poll(2, TimeUnit.SECONDS);
        assertNotNull(received);
        assertEquals("Status OK", received.getContent());
        assertEquals("Dev", received.getSender());
    }

    @Test
    public void testXSSPayloadPassThrough() throws Exception {
        StompSession session = connect();
        TestStompSessionHandler handler = new TestStompSessionHandler();
        session.subscribe("/topic/security", handler);

        String xssContent = "<script>alert('hacked')</script>";
        ChatMessageDTO msg = ChatMessageDTO.builder().sender("Hacker").content(xssContent).type(MessageType.CHAT)
                .build();

        session.send("/app/chat/security/sendMessage", msg);

        ChatMessageDTO received = handler.messages.poll(2, TimeUnit.SECONDS);
        assertNotNull(received);
        // Verify content is NOT stripped by backend (Frontend handles safety via
        // innerText)
        assertEquals(xssContent, received.getContent());
    }

    @Test
    public void testLargePayload() throws Exception {
        StompSession session = connect();
        TestStompSessionHandler handler = new TestStompSessionHandler();
        session.subscribe("/topic/load", handler);

        // Generate 2KB string (within default test client limits)
        String largeContent = IntStream.range(0, 2000).mapToObj(i -> "a").collect(Collectors.joining(""));
        ChatMessageDTO msg = ChatMessageDTO.builder().sender("Loader").content(largeContent).type(MessageType.CHAT)
                .build();

        session.send("/app/chat/load/sendMessage", msg);

        ChatMessageDTO received = handler.messages.poll(5, TimeUnit.SECONDS); // Allow more time
        assertNotNull(received);
        assertEquals(largeContent.length(), received.getContent().length());
    }

    private static class TestStompSessionHandler extends StompSessionHandlerAdapter {
        public final BlockingQueue<ChatMessageDTO> messages = new LinkedBlockingQueue<>();

        @Override
        public Type getPayloadType(StompHeaders headers) {
            return ChatMessageDTO.class;
        }

        @Override
        public void handleFrame(StompHeaders headers, Object payload) {
            messages.add((ChatMessageDTO) payload);
        }
    }
}
