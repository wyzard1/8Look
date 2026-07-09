package com._look.api.services;

import com._look.api.entities.User;
import com._look.api.repositories.UserRespository;

import java.util.List;

public class UserService {
    private final UserRespository respository;

    public UserService(UserRespository respository) {
        this.respository = respository;
    }


}
