// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getFirestore,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    getAuth,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAES4W-xwqBIAnqnNYTOfTtq1MOamc2AB0",
    authDomain: "powerfitness-2a4a4.firebaseapp.com",
    projectId: "powerfitness-2a4a4",
    storageBucket: "powerfitness-2a4a4.firebasestorage.app",
    messagingSenderId: "864803334343",
    appId: "1:864803334343:web:f127b77a50e95bb43bf6e2",
    measurementId: "G-C90V5WGZQH"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Elementos da página
const form = document.getElementById("cadastroForm");
const toast = document.getElementById("toast");

// Verifica se o formulário existe
if (form) {

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value;
        const telefone = document.getElementById("telefone").value.trim();

        // Validação
        if (!nome || !email || !senha || !telefone) {
            alert("Preencha todos os campos.");
            return;
        }

        if (senha.length < 6) {
            alert("A senha deve possuir pelo menos 6 caracteres.");
            return;
        }

        try {

            // Cria usuário no Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                senha
            );

            // Salva dados no Firestore
            await setDoc(doc(db, "usuarios", userCredential.user.uid), {
                nome: nome,
                email: email,
                telefone: telefone,
                criadoEm: new Date()
            });

            // Toast de sucesso
            if (toast) {
                toast.classList.add("show");

                setTimeout(() => {
                    toast.classList.remove("show");
                }, 3000);
            }

            form.reset();

            console.log("Usuário cadastrado com sucesso!");

        } catch (error) {

            console.error(error);

            switch (error.code) {

                case "auth/email-already-in-use":
                    alert("Este e-mail já está cadastrado.");
                    break;

                case "auth/invalid-email":
                    alert("E-mail inválido.");
                    break;

                case "auth/weak-password":
                    alert("A senha deve possuir pelo menos 6 caracteres.");
                    break;

                case "auth/network-request-failed":
                    alert("Sem conexão com a internet.");
                    break;

                default:
                    alert("Erro ao cadastrar: " + error.message);
                    break;
            }
        }

    });

}