package com.chat.app.dto;

import com.chat.app.model.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private String content;
    protected String sender;
    private String channel;
    private MessageType type;
}
