package com._look.api.services;

import DTO.UserDTO;
import com._look.api.entities.Role;
import com._look.api.entities.User;
import com._look.api.repositories.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;


@Transactional
@Service
public class UserService implements IUserService{

    private final UserRepository repository;


    public UserService(UserRepository respository, UserRepository repository) {
        this.repository = repository;
    }


    @Override
    public User registerNewUser(UserDTO dto) throws UserAlreadyExistException{
        if(emailExists(dto.getEmail()))
        {
            throw new UserAlreadyExistException("User with that email already exists");
        }

        User u = new User();
        u.setUsername(dto.getUsername());
        u.setEmail(dto.getEmail());
        u.setPassword(dto.getPassword());
        u.setPhone_number(dto.getPhone_number());
        u.setRole(Role.USER);

        repository.save(u);
        return null;
    }

    private boolean emailExists(String email) {
        return repository.findByEmail(email) != null;
    }
}
