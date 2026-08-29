package com._look.api.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatIdOrderByTimestampAsc(String chatId);
    Optional<ChatMessage> findTopByChatIdOrderByTimestampDesc(String chatId);
}
