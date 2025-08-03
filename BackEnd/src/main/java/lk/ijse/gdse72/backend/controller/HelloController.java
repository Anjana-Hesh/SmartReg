package lk.ijse.gdse72.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/hello")
@CrossOrigin
public class HelloController {

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public String hello() {
        return "Hello, ADMIN!";
    }

    @GetMapping("/driver")
    @PreAuthorize("hasRole('DRIVER')")
    public String helloUser() {
        return "Hello, DRIVER!";
    }

}
