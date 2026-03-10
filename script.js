const { jsPDF } = window.jspdf;

// ── Cifra de César (shift=7) ─────────────────────────────────────
const CZ_SHIFT = 7;
const PORTADORA_NOME_ENC = "Qlupmly Jvzah kl Hiyhualz";
const PORTADORA_CPF_ENC  = "79208838897";

function caesarDecrypt(text, shift) {
  return text
    .split("")
    .map(function (ch) {
      var code = ch.charCodeAt(0);
      if (code >= 48 && code <= 57) {
        return String.fromCharCode(((code - 48 - shift + 10) % 10) + 48);
      }
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
      }
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 - shift + 26) % 26) + 97);
      }
      return ch;
    })
    .join("");
}

// ── Utilitários ──────────────────────────────────────────────────

function formatCPF(raw) {
  var d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + "." + d.slice(3);
  if (d.length <= 9)
    return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6);
  return (
    d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9)
  );
}

function dataHojeBR() {
  var d = new Date();
  var meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return (
    d.getDate() + " de " + meses[d.getMonth()] + " de " + d.getFullYear()
  );
}

function dataHojeCurta() {
  var d = new Date();
  var dia = String(d.getDate()).padStart(2, "0");
  var mes = String(d.getMonth() + 1).padStart(2, "0");
  return dia + "/" + mes + "/" + d.getFullYear();
}

function normalizarNome(nome) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Máscara de CPF ao digitar ────────────────────────────────────

function aplicarMascaraCPF(input) {
  input.addEventListener("input", function () {
    var v = input.value.replace(/\D/g, "").slice(0, 11);
    input.value = formatCPF(v);
  });
}

// ── Controle de telas ────────────────────────────────────────────

var modoCorredora = false;

var screenChoice = document.getElementById("screen-choice");
var screenForm = document.getElementById("screen-form");
var fieldsetPortador = document.getElementById("fieldset-portador");
var formSubtitle = document.getElementById("form-subtitle");
var portadorNomeInput = document.getElementById("portador-nome");
var portadorCpfInput = document.getElementById("portador-cpf");

aplicarMascaraCPF(document.getElementById("atleta-cpf"));
aplicarMascaraCPF(portadorCpfInput);

function mostrarForm(isCorredora) {
  modoCorredora = isCorredora;
  screenChoice.classList.remove("active");
  screenForm.classList.add("active");

  if (isCorredora) {
    fieldsetPortador.classList.add("hidden");
    portadorNomeInput.removeAttribute("required");
    portadorCpfInput.removeAttribute("required");
    formSubtitle.textContent =
      "Kit retirado pela @corredoradf. Preencha apenas os dados do atleta.";
  } else {
    fieldsetPortador.classList.remove("hidden");
    portadorNomeInput.setAttribute("required", "");
    portadorCpfInput.setAttribute("required", "");
    portadorNomeInput.value = "";
    portadorCpfInput.value = "";
    formSubtitle.textContent =
      "Preencha os dados do atleta e de quem vai retirar o kit.";
  }
}

document.getElementById("btn-sim").addEventListener("click", function () {
  mostrarForm(true);
});

document.getElementById("btn-nao").addEventListener("click", function () {
  mostrarForm(false);
});

document.getElementById("btn-voltar").addEventListener("click", function () {
  screenForm.classList.remove("active");
  screenChoice.classList.add("active");
  document.getElementById("form-pdf").reset();
});

// ── Geração do PDF ───────────────────────────────────────────────

document.getElementById("form-pdf").addEventListener("submit", function (e) {
  e.preventDefault();

  var atletaNome = document.getElementById("atleta-nome").value.trim();
  var atletaCpfRaw = document.getElementById("atleta-cpf").value.replace(/\D/g, "");

  if (!atletaNome || atletaCpfRaw.length < 11) {
    alert("Preencha corretamente os dados do atleta.");
    return;
  }

  var portadorNome, portadorCpfRaw;

  if (modoCorredora) {
    portadorNome = caesarDecrypt(PORTADORA_NOME_ENC, CZ_SHIFT);
    portadorCpfRaw = caesarDecrypt(PORTADORA_CPF_ENC, CZ_SHIFT);
  } else {
    portadorNome = portadorNomeInput.value.trim();
    portadorCpfRaw = portadorCpfInput.value.replace(/\D/g, "");
    if (!portadorNome || portadorCpfRaw.length < 11) {
      alert("Preencha corretamente os dados do portador.");
      return;
    }
  }

  var atletaCpf = formatCPF(atletaCpfRaw);
  var portadorCpf = formatCPF(portadorCpfRaw);

  gerarPDF(atletaNome, atletaCpf, portadorNome, portadorCpf);
});

// ── PDF ──────────────────────────────────────────────────────────

function drawLine(doc, x1, y, x2) {
  doc.setDrawColor(100, 80, 150);
  doc.setLineWidth(0.4);
  doc.line(x1, y, x2, y);
}

function gerarPDF(atletaNome, atletaCpf, portadorNome, portadorCpf) {
  var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  var pageW = 210;
  var ml = 25;
  var mr = 25;
  var larg = pageW - ml - mr;
  var y = 25;

  // Borda decorativa roxa
  doc.setDrawColor(123, 104, 174);
  doc.setLineWidth(0.8);
  doc.rect(15, 12, 180, 273);
  doc.setDrawColor(180, 160, 220);
  doc.setLineWidth(0.3);
  doc.rect(17, 14, 176, 269);

  // Linha decorativa superior
  doc.setFillColor(123, 104, 174);
  doc.rect(15, 12, 180, 5, "F");

  // Título principal
  y = 30;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(74, 58, 122);
  doc.text("AUTORIZAÇÃO PARA RETIRADA", pageW / 2, y, { align: "center" });
  y += 7;
  doc.text("DE KIT POR TERCEIROS", pageW / 2, y, { align: "center" });
  y += 5;

  // Linha separadora abaixo do título
  doc.setDrawColor(214, 51, 108);
  doc.setLineWidth(0.6);
  doc.line(60, y, 150, y);
  y += 16;

  // Corpo da autorização
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);

  var textoEu = "Eu, ";
  var textoPortadorA1 = ", portador(a) do CPF ";
  var textoAutorizo = ", autorizo ";
  var textoPortadorA2 = ", portador(a) do CPF ";
  var textoFinal = ", a retirar meu kit da corrida.";

  var corpo =
    textoEu + atletaNome.toUpperCase() + textoPortadorA1 + atletaCpf +
    textoAutorizo + portadorNome.toUpperCase() + textoPortadorA2 + portadorCpf +
    textoFinal;

  var linhas = doc.splitTextToSize(corpo, larg);

  for (var i = 0; i < linhas.length; i++) {
    doc.text(linhas[i], ml, y);
    y += 7;
  }

  // Seção de dados estruturados
  y += 10;
  doc.setFillColor(245, 240, 255);
  doc.roundedRect(ml, y - 5, larg, 42, 3, 3, "F");
  doc.setDrawColor(180, 160, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(ml, y - 5, larg, 42, 3, 3, "S");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(123, 104, 174);
  doc.text("ATLETA", ml + 6, y + 2);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text("Nome: " + atletaNome, ml + 6, y + 9);
  doc.text("CPF: " + atletaCpf, ml + 6, y + 15);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(123, 104, 174);
  doc.text("PORTADOR(A) AUTORIZADO(A)", ml + 6, y + 24);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text("Nome: " + portadorNome, ml + 6, y + 31);
  doc.text("CPF: " + portadorCpf, ml + 6, y + 37);

  y += 52;

  // Data
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text("Brasília/DF, " + dataHojeBR() + ".", ml, y);

  y += 30;

  // Assinatura do atleta
  var sigW = 70;
  var sigX1 = ml;
  var sigX1Center = ml + sigW / 2;

  drawLine(doc, sigX1, y, sigX1 + sigW);
  y += 5;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Assinatura do atleta", sigX1Center, y, { align: "center" });
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(atletaNome, sigX1Center, y, { align: "center" });

  y += 22;

  // Assinatura do portador
  drawLine(doc, sigX1, y, sigX1 + sigW);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Assinatura do portador", sigX1Center, y, { align: "center" });
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(portadorNome, sigX1Center, y, { align: "center" });

  // Rodapé
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(
    "Documento gerado em " + dataHojeCurta() + " via pegameukitdf",
    pageW / 2,
    278,
    { align: "center" }
  );

  // Salvar
  var nomeArquivo = "autorizacao-kit-" + normalizarNome(atletaNome) + ".pdf";
  doc.save(nomeArquivo);
}
