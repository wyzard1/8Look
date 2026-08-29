package com._look.api.repositories;

import com._look.api.entities.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findBySenderIdAndRecipientId(Long senderId, Long recipientId);
    List<Conversation> findBySenderId(Long senderId);
}
