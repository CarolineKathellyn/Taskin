package com.server.taskin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TeamRequest {

    @NotBlank(message = "Nome da equipe é obrigatório")
    @Size(max = 100, message = "Nome não pode ter mais de 100 caracteres")
    private String name;

    @Size(max = 500, message = "Descrição não pode ter mais de 500 caracteres")
    private String description;

    public TeamRequest() {}

    public TeamRequest(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
