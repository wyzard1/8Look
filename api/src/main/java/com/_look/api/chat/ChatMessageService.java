package com._look.api.chat;

import com._look.api.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository repository;
    private final ConversationService conversationService;

    public ChatMessage save(ChatMessage message)
    {
        String chatId = conversationService.getConversationId(message.getSenderId(),
                message.getRecipientId(), true).orElseThrow();
        message.setChatId(chatId);
        message.setTimestamp(Instant.now());
        return repository.save(message);
    }

    public List<ChatMessage> findChatMessages(Long senderId, Long recipientId)
    {
        var chatId = conversationService.getConversationId(senderId, recipientId, false);
        return chatId.map(repository::findByChatIdOrderByTimestampAsc).orElse(new ArrayList<>());
    }
}
