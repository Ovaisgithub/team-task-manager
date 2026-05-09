package com.example.taskmanager.service;

import com.example.taskmanager.dto.AuthRequest;
import com.example.taskmanager.dto.AuthResponse;
import com.example.taskmanager.dto.RegisterRequest;
import com.example.taskmanager.exception.UnauthorizedException;
import com.example.taskmanager.model.LoginToken;
import com.example.taskmanager.model.Role;
import com.example.taskmanager.model.User;
import com.example.taskmanager.repository.LoginTokenRepository;
import com.example.taskmanager.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final LoginTokenRepository loginTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                       LoginTokenRepository loginTokenRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.loginTokenRepository = loginTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UnauthorizedException("Email already registered");
        }
        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // First user becomes ADMIN, all others MEMBER
        user.setRole(userRepository.count() == 0 ? Role.ADMIN : Role.MEMBER);
        userRepository.save(user);
        return createToken(user);
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid credentials");
        }
        return createToken(user);
    }

    private AuthResponse createToken(User user) {
        LoginToken token = new LoginToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(user);
        token.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        loginTokenRepository.save(token);
        return new AuthResponse(token.getToken(), user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    public User authenticate(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Missing or invalid Authorization header");
        }
        String tokenValue = authHeader.substring(7);
        LoginToken token = loginTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new UnauthorizedException("Invalid token"));
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Token expired, please log in again");
        }
        return token.getUser();
    }
}
