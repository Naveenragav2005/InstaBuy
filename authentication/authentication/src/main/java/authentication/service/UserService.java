package authentication.service;


import authentication.model.Users;
import authentication.repo.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class UserService {

    @Autowired
    private UserRepo repo;

    @Autowired
    JWTService jwtService;

    @Autowired
    AuthenticationManager authManager;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    public Users register(Users user){
        if (repo.findByUsername(user.getUsername()) != null) {
            throw new ResponseStatusException(CONFLICT, "User already exists");
        }

        user.setPassword(encoder.encode(user.getPassword()));

        if(user.getRole() == null){
            user.setRole("ROLE_USER");
        }

        return repo.save(user);
    }
    public String verify(Users user) {
        Authentication authentication;
        try {
            authentication =
                    authManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    user.getUsername(),
                                    user.getPassword()));
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
        }

        if(authentication.isAuthenticated()) {

            UserDetails userDetails =
                    (UserDetails) authentication.getPrincipal();

            return jwtService.generateToken(userDetails);
        }

        throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
    }
}
