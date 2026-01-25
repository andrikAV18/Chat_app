package com.chat.app.controller;

import com.chat.app.dto.ChatMessageDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.security.Principal;

import com.chat.app.model.Channel;
import com.chat.app.model.ChannelType;
import com.chat.app.model.Message;
import com.chat.app.model.User;
import com.chat.app.repository.ChannelRepository;
import com.chat.app.repository.MessageRepository;
import com.chat.app.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChannelRepository channelRepository;

    @Autowired
    private MessageRepository messageRepository;

    @MessageMapping("/chat/{channelId}/sendMessage")
    public void sendMessage(@DestinationVariable String channelId, @Payload ChatMessageDTO chatMessage,
            Principal principal) {
        chatMessage.setChannel(channelId);
        chatMessage.setSender(principal.getName());

        saveMessage(channelId, chatMessage);

        messagingTemplate.convertAndSend("/topic/" + channelId, chatMessage);
    }

    @GetMapping("/api/messages/{channelName}")
    @ResponseBody
    public List<ChatMessageDTO> getMessages(@PathVariable String channelName) {
        Channel channel = channelRepository.findByName(channelName);
        if (channel == null) {
            return List.of();
        }
        return messageRepository.findByChannelIdOrderByTimestampAsc(channel.getId()).stream()
                .map(msg -> ChatMessageDTO.builder()
                        .content(msg.getContent())
                        .sender(msg.getSender().getUsername())
                        .channel(channelName)
                        .type(msg.getType())
                        .build())
                .collect(Collectors.toList());
    }

    private void saveMessage(String channelName, ChatMessageDTO chatMessageDTO) {
        User sender = userRepository.findByUsername(chatMessageDTO.getSender()).orElseThrow();
        Channel channel = channelRepository.findByName(channelName);
        if (channel == null) {
            channel = Channel.builder()
                    .name(channelName)
                    .type(ChannelType.PUBLIC)
                    .build();
            channelRepository.save(channel);
        }

        Message message = Message.builder()
                .sender(sender)
                .channel(channel)
                .content(chatMessageDTO.getContent())
                .timestamp(LocalDateTime.now())
                .type(chatMessageDTO.getType())
                .build();

        messageRepository.save(message);
    }

    @MessageMapping("/chat/{channelId}/addUser")
    public void addUser(@DestinationVariable String channelId, @Payload ChatMessageDTO chatMessage,
            SimpMessageHeaderAccessor headerAccessor, Principal principal) {
        // Add username in web socket session
        String username = principal.getName();
        headerAccessor.getSessionAttributes().put("username", username);
        chatMessage.setChannel(channelId);
        chatMessage.setSender(username);
        messagingTemplate.convertAndSend("/topic/" + channelId, chatMessage);
    }
}
