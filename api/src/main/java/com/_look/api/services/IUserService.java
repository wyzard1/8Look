package com._look.api.services;

import DTO.UserDTO;
import com._look.api.entities.User;

public interface IUserService {
    User registerNewUser(UserDTO dto);
}
