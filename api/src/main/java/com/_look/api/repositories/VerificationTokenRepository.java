package com._look.api.repositories;

import com._look.api.entities.User;
import com._look.api.entities.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Date;
import java.util.List;

public interface VerificationTokenRepository
        extends JpaRepository<VerificationToken, Long> {

    VerificationToken findByToken(String token);

    VerificationToken findByTokenAndPurpose(String token, String purpose);

    VerificationToken findByUserAndPurpose(User user, String purpose);

    List<VerificationToken> findByExpiryDateLessThan(Date now);

    void deleteByExpiryDateLessThan(Date now);

    void deleteByUserAndPurpose(User user, String purpose);
}
