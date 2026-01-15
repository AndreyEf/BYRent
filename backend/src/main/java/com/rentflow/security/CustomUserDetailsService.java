package com.rentflow.security;

import com.rentflow.entity.User;
import com.rentflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден: " + email));
        
        if (Boolean.TRUE.equals(user.getIsBlocked())) {
            throw new UsernameNotFoundException("Ваш аккаунт заблокирован. Обратитесь в поддержку.");
        }
        
        return new CustomUserDetails(user);
    }
}
