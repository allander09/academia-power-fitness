function calcularMensalidade() {

    let plano = parseFloat(document.getElementById("plano").value);
    let meses = parseInt(document.getElementById("meses").value);

    if (isNaN(meses) || meses <= 0) {

        document.getElementById("resultadoMensalidade").innerHTML =
            "Digite uma quantidade válida de meses.";

        return;
    }

    let total = plano * meses;

    document.getElementById("resultadoMensalidade").innerHTML =
        `Valor total: R$ ${total.toFixed(2)}`;

}