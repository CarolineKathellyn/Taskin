package com.server.taskin.service;

import com.server.taskin.model.User;
import com.server.taskin.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    @Lazy
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findActiveUserByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));
        return user;
    }

    public User createUser(String email, String password, String name) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email já está em uso");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setEnabled(true);

        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User findById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    public User updateTaskDatabase(String userId, String taskDatabase) {
        User user = findById(userId);
        user.setTaskDatabase(taskDatabase);
        user.setLastSyncAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public String getTaskDatabase(String userId) {
        Optional<String> taskDatabase = userRepository.findTaskDatabaseByUserId(userId);
        return taskDatabase.orElse(null);
    }

    public User updateLastSyncAt(String userId) {
        User user = findById(userId);
        user.setLastSyncAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public boolean authenticateUser(String email, String password) {
        Optional<User> userOpt = userRepository.findActiveUserByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return passwordEncoder.matches(password, user.getPassword());
        }
        return false;
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}