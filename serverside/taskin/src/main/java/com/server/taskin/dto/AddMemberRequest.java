package com.server.taskin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AddMemberRequest {

    @NotBlank(message = "Email do usuário é obrigatório")
    @Email(message = "Email deve ter formato válido")
    private String email;

    public AddMemberRequest() {}

    public AddMemberRequest(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
