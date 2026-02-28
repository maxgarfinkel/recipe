package com.maxgarfinkel.recipes.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sub;

    @Column(nullable = false)
    private String displayName;

    public AppUser(String sub, String displayName) {
        this.sub = sub;
        this.displayName = displayName;
    }
}
