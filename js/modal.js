function abrirModal(plano, valor) {

    document.getElementById("modal").style.display = "flex";

    document.getElementById("tituloPlano").innerHTML = plano;

    document.getElementById("descricaoPlano").innerHTML =
        `Valor da mensalidade: ${valor}`;

}

function fecharModal() {

    document.getElementById("modal").style.display = "none";

}