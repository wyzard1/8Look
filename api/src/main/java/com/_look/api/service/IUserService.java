package com._look.api.service;

import com._look.api.DTO.UserDTO;
import com._look.api.entities.User;
import com._look.api.entities.VerificationToken;

public interface IUserService {

    User registerNewUser(UserDTO dto) throws UserAlreadyExistException;

    User getUser(String verificationToken);

    void saveRegisteredUser(User user);

    void createVerificationToken(User user, String token);

    VerificationToken getVerificationToken(String VerificationToken);
}
