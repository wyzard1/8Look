package com._look.api.controllers;

import com._look.api.chat.ChatMessage;
import com._look.api.chat.ChatConversation;
import com._look.api.chat.ChatMessageService;
import com._look.api.chat.ChatNotification;
import com._look.api.entities.User;
import com._look.api.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageService chatMessageService;
    private final ConversationService conversationService;

    @MessageMapping("/chat")
    public void processMessages(
            @Payload ChatMessage message
    )
    {
        ChatMessage savedMsg = chatMessageService.save(message);
        ChatNotification notification = ChatNotification.builder()
                        .id(savedMsg.getId()).senderId(savedMsg.getSenderId()).recipientId(savedMsg.getRecipientId())
                        .content(savedMsg.getContent()).timestamp(savedMsg.getTimestamp()).build();
        messagingTemplate.convertAndSend("/topic/messages/" + savedMsg.getRecipientId(), notification);
        messagingTemplate.convertAndSend("/topic/messages/" + savedMsg.getSenderId(), notification);
    }

    @GetMapping("/messages/{senderId}/{recipientId}")
    public ResponseEntity<List<ChatMessage>> findChatMessages(
            @PathVariable("senderId") Long senderId,
            @PathVariable("recipientId") Long recipientId
    )
    {
        return ResponseEntity.ok(chatMessageService.findChatMessages(senderId, recipientId));
    }

    @GetMapping("/messages/{recipientId}")
    public ResponseEntity<List<ChatMessage>> findMyChatMessages(
            @PathVariable("recipientId") Long recipientId,
            Authentication authentication
    )
    {
        if(authentication == null || !(authentication.getPrincipal() instanceof User user))
        {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(chatMessageService.findChatMessages(user.getId(), recipientId));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ChatConversation>> findConversations(Authentication authentication)
    {
        if(authentication == null || !(authentication.getPrincipal() instanceof User user))
        {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(conversationService.findConversationsForUser(user.getId()));
    }

}
