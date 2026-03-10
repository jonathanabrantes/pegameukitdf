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

// ── Pré-carregar logo como base64 para o PDF ─────────────────────

var logoBase64 = null;

(function preloadLogo() {
  var img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = function () {
    var canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);
    logoBase64 = canvas.toDataURL("image/png");
  };
  img.src = "corredoradf.png";
})();

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

function gerarPDF(atletaNome, atletaCpf, portadorNome, portadorCpf) {
  var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  var cx = 105;
  var ml = 30;
  var larg = 150;
  var y = 20;

  // Logo centralizada
  if (logoBase64) {
    var logoW = 30;
    var logoH = 30;
    doc.addImage(logoBase64, "PNG", cx - logoW / 2, y, logoW, logoH);
    y += logoH + 8;
  } else {
    y += 15;
  }

  // Título
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text("AUTORIZAÇÃO PARA RETIRADA DE KIT ATLETA POR TERCEIRO", cx, y, { align: "center" });
  y += 12;

  // Linha fina separadora
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(ml, y, ml + larg, y);
  y += 15;

  // Texto da autorização
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  doc.text("Eu,", ml, y);
  doc.setFont("Helvetica", "bold");
  doc.text(atletaNome, ml + 8, y);
  var nomeW = doc.getTextWidth(atletaNome);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(ml + 8, y + 1, ml + 8 + nomeW, y + 1);

  y += 8;
  doc.setFont("Helvetica", "normal");
  doc.text("portador(a) do CPF:", ml, y);
  doc.setFont("Helvetica", "bold");
  doc.text(atletaCpf, ml + 37, y);
  var cpfW = doc.getTextWidth(atletaCpf);
  doc.line(ml + 37, y + 1, ml + 37 + cpfW, y + 1);

  y += 12;
  doc.setFont("Helvetica", "normal");
  doc.text("autorizo", ml, y);
  doc.setFont("Helvetica", "bold");
  doc.text(portadorNome, ml + 16, y);
  var pNomeW = doc.getTextWidth(portadorNome);
  doc.line(ml + 16, y + 1, ml + 16 + pNomeW, y + 1);

  y += 8;
  doc.setFont("Helvetica", "normal");
  doc.text("portador(a) do CPF:", ml, y);
  doc.setFont("Helvetica", "bold");
  doc.text(portadorCpf, ml + 37, y);
  var pCpfW = doc.getTextWidth(portadorCpf);
  doc.line(ml + 37, y + 1, ml + 37 + pCpfW, y + 1);

  y += 12;
  doc.setFont("Helvetica", "normal");
  doc.text("a retirar meu kit da corrida.", ml, y);

  y += 20;

  // Data
  doc.text("Local e Data: Brasília/DF, " + dataHojeBR() + ".", ml, y);

  y += 30;

  // Assinatura do atleta
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  var sigW = 80;
  var sigX = cx - sigW / 2;
  doc.line(sigX, y, sigX + sigW, y);
  y += 5;
  doc.setFontSize(10);
  doc.text("Assinatura do atleta", cx, y, { align: "center" });

  y += 25;

  // Assinatura do portador
  doc.line(sigX, y, sigX + sigW, y);
  y += 5;
  doc.text("Assinatura do portador", cx, y, { align: "center" });

  // Salvar
  var nomeArquivo = "autorizacao-kit-" + normalizarNome(atletaNome) + ".pdf";
  doc.save(nomeArquivo);
}
