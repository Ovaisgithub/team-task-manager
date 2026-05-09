package com.example.taskmanager.controller;

import com.example.taskmanager.model.User;
import com.example.taskmanager.repository.UserRepository;
import com.example.taskmanager.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final AuthService authService;

    public UserController(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    /** Returns all registered users (id, name, email, role — password is @JsonIgnore). */
    @GetMapping
    public List<User> getAllUsers(@RequestHeader("Authorization") String auth) {
        authService.authenticate(auth); // must be logged in
        return userRepository.findAll();
    }
}
