package com._look.api.service;

import com._look.api.chat.ChatConversation;
import com._look.api.chat.ChatMessageRepository;
import com._look.api.entities.Conversation;
import com._look.api.entities.User;
import com._look.api.repositories.ConversationRepository;
import com._look.api.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository repository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public Optional<String> getConversationId(Long senderId, Long recipientId, boolean createNewRoomIfNotExists)
    {
        return repository.findBySenderIdAndRecipientId(senderId, recipientId)
                .map(Conversation::getChatId)
                .or(() -> {
            if(createNewRoomIfNotExists)
            {
                String chatId = createConversationId(senderId, recipientId);
                return Optional.of(chatId);
            }
            return Optional.empty();
        });
    }

    private String createConversationId(Long senderId, Long recipientId) {
        String chatId = String.format("%s_%s", senderId, recipientId);
        Conversation senderRecipient = Conversation.builder()
                .chatId(chatId)
                .senderId(senderId)
                .recipientId(recipientId)
                .build();

        Conversation recipientSender = Conversation.builder()
                .chatId(chatId)
                .senderId(recipientId)
                .recipientId(senderId)
                .build();
        repository.save(senderRecipient);
        repository.save(recipientSender);
        return chatId;
    }

    public List<ChatConversation> findConversationsForUser(Long userId) {
        return repository.findBySenderId(userId).stream()
                .map(conversation -> {
                    Optional<User> recipient = userRepository.findById(conversation.getRecipientId());
                    if (recipient.isEmpty()) {
                        return null;
                    }

                    User user = recipient.get();
                    var latestMessage = chatMessageRepository.findTopByChatIdOrderByTimestampDesc(conversation.getChatId());

                    return ChatConversation.builder()
                            .userId(user.getId())
                            .username(user.getUsername())
                            .avatarUrl(user.getAvatar_url())
                            .lastMessage(latestMessage.map(message -> message.getContent()).orElse(null))
                            .lastMessageAt(latestMessage.map(message -> message.getTimestamp()).orElse(null))
                            .build();
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(
                        ChatConversation::getLastMessageAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }

}
