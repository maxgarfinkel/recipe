package com.maxgarfinkel.recipes.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppUserService {

    private final AppUserRepository appUserRepository;

    public AppUser findOrCreate(String sub, String displayName) {
        return appUserRepository.findBySub(sub)
                .orElseGet(() -> appUserRepository.save(new AppUser(sub, displayName)));
    }
}
