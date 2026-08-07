function calcularIMC() {

    let peso = parseFloat(document.getElementById("peso").value);
    let altura = parseFloat(document.getElementById("altura").value);

    if (isNaN(peso) || isNaN(altura) || peso <= 0 || altura <= 0) {
        document.getElementById("resultadoIMC").innerHTML =
            "Preencha os campos corretamente.";
        return;
    }

    let imc = peso / (altura * altura);

    let situacao = "";

    if (imc < 18.5) {
        situacao = "Abaixo do peso";
    } else if (imc < 25) {
        situacao = "Peso normal";
    } else if (imc < 30) {
        situacao = "Sobrepeso";
    } else {
        situacao = "Obesidade";
    }

    document.getElementById("resultadoIMC").innerHTML =
        `Seu IMC é ${imc.toFixed(2)} - ${situacao}`;
}