import { Button, TextField } from "@mui/material";
import React from "react";
import image1 from "../assets/image-1.png";
import "./LoginPage.css";

export const LoginPage = () => {
  return (
    <main className="login-page">
      <section className="login-container">
        <header className="login-header">
          <img
            className="logo"
            src={image1}
            alt="Hewlett Packard Enterprise Logo"
          />
        </header>

        <section className="login-form-section">
          <h1 className="welcome-text">Bienvenido de vuelta!</h1>

          <form className="login-form" noValidate autoComplete="off">
            <TextField
              fullWidth
              variant="outlined"
              label="Nombre de usuario"
              InputLabelProps={{ style: { color: "#5e8c7c" } }}
              className="input-field"
            />

            <TextField
              fullWidth
              variant="outlined"
              label="Contraseña"
              type="password"
              InputLabelProps={{ style: { color: "#5e8c7c" } }}
              className="input-field"
            />

            <Button
              variant="contained"
              color="primary"
              size="medium"
              className="login-button"
              fullWidth
            >
              Login
            </Button>
          </form>

          <footer className="login-footer">
            <p className="signup-text">No tienes una cuenta? Inicia sesión</p>
          </footer>
        </section>
      </section>
    </main>
  );
};
