package com._look.api.chat;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class ChatConversation {
    private Long userId;
    private String username;
    private String avatarUrl;
    private String lastMessage;
    private Instant lastMessageAt;
}
