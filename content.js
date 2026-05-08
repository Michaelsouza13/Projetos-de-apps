// ======================================================================
// 1. CRIAÇÃO DA INTERFACE VISUAL (NOVO DESIGN)
// ======================================================================
const flutuante = document.createElement('div');
flutuante.id = 'extensao-drive-wrapper';

flutuante.innerHTML = `
    <div id="drive-fechar" style="display:none;" title="Fechar">✖</div>
    <div id="drive-icone">
        <span style="font-size: 18px;">📁</span> Salvar no Drive
    </div>
    <div id="drive-area-drop" style="display:none;">
        <div style="font-size: 30px; margin-bottom: 10px;">☁️</div>
        Solte a planilha aqui
    </div>
    <div id="drive-status" style="display:none;"></div>
`;

const estilo = document.createElement('style');
estilo.innerHTML = `
    #extensao-drive-wrapper {
        position: fixed; bottom: 40px; right: 40px;
        z-index: 999999; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
        display: none;
    }
    
    /* Design do Botão Flutuante Principal */
    #drive-icone {
        background: linear-gradient(135deg, #4285f4, #34a853); 
        color: white; padding: 12px 24px;
        border-radius: 50px; cursor: pointer; font-weight: 600; font-size: 14px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2); 
        transition: all 0.3s ease; 
        display: flex; align-items: center; gap: 8px;
    }
    #drive-icone:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }

    /* Design do Botão de Fechar ('X') */
    #drive-fechar {
        position: absolute; top: -8px; right: -8px;
        background: white; color: #555; border-radius: 50%;
        width: 24px; height: 24px; text-align: center; line-height: 24px;
        cursor: pointer; font-size: 12px; font-weight: bold; z-index: 10;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.2s;
    }
    #drive-fechar:hover {
        background: #fce8e6; color: #d93025;
    }

    /* Design da Área Tracejada */
    #drive-area-drop {
        background: #ffffff; border: 2px dashed #4285f4; color: #5f6368;
        padding: 30px 20px; border-radius: 12px; text-align: center;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15); width: 220px; 
        font-weight: 500; transition: all 0.3s ease;
    }
    #drive-area-drop.arrastando {
        background: #e8f0fe; border-color: #1a73e8; transform: scale(1.02);
    }

    /* Design da Caixa de Status/Link */
    #drive-status {
        margin-top: 15px; background: white; padding: 15px;
        border-radius: 12px; text-align: center; font-weight: 500; color: #3c4043;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15); font-size: 14px;
    }
    .botao-link-drive {
        display: inline-block; margin-top: 10px; padding: 8px 15px;
        background: #f8f9fa; color: #1a73e8; text-decoration: none;
        border-radius: 8px; font-size: 13px; border: 1px solid #dadce0;
        font-weight: 600; transition: 0.2s;
    }
    .botao-link-drive:hover { 
        background: #f1f3f4; border-color: #d2e3fc; 
    }
`;
document.head.appendChild(estilo);
document.body.appendChild(flutuante);

// ======================================================================
// 2. LÓGICA DO TEMPORIZADOR DE OCULTAÇÃO
// ======================================================================
let temporizadorOcultar; // Variável que guardará o relógio

// Função que inicia o relógio de 15 segundos
function iniciarTemporizador() {
    clearTimeout(temporizadorOcultar); // Zera o relógio antigo, se houver
    temporizadorOcultar = setTimeout(() => {
        flutuante.style.display = "none";
    }, 15000); // 15000 milissegundos = 15 segundos
}

// Função que pausa/cancela o relógio
function pararTemporizador() {
    clearTimeout(temporizadorOcultar);
}

// ======================================================================
// 3. EVENTOS DA TELA
// ======================================================================
const icone = document.getElementById('drive-icone');
const areaDrop = document.getElementById('drive-area-drop');
const botaoFechar = document.getElementById('drive-fechar');
const divStatus = document.getElementById('drive-status');

// Escuta a ordem do 'background'
chrome.runtime.onMessage.addListener((mensagem) => {
    if (mensagem.acao === "mostrar_icone") {
        flutuante.style.display = "block";
        botaoFechar.style.display = "block";
        icone.style.display = "flex"; // Usa flex para manter ícone e texto alinhados
        areaDrop.style.display = "none";
        divStatus.style.display = "none";

        iniciarTemporizador(); // O botão apareceu, começa a contar os 15s!

    } else if (mensagem.acao === "status_upload") {
        divStatus.style.display = "block";

        if (mensagem.sucesso && mensagem.link) {
            divStatus.innerHTML = `
                ${mensagem.texto} <br>
                <a href="${mensagem.link}" target="_blank" class="botao-link-drive">🔗 Abrir Planilha</a>
            `;
            // Quando finaliza com sucesso, espera 10s e esconde tudo
            setTimeout(() => { flutuante.style.display = "none"; }, 10000);
        } else {
            divStatus.innerText = mensagem.texto;
        }
    }
});

// Fecha a janelinha manualmente
botaoFechar.addEventListener('click', () => {
    flutuante.style.display = "none";
    pararTemporizador();
});

// Interações de arrastar
flutuante.addEventListener('dragover', (e) => {
    e.preventDefault();
    pararTemporizador(); // O usuário está tentando usar, pare de contar!

    icone.style.display = "none";
    areaDrop.style.display = "block";
    areaDrop.classList.add('arrastando'); // Ativa o visual de 'arrastando' do CSS
});

flutuante.addEventListener('dragleave', () => {
    areaDrop.classList.remove('arrastando'); // Desativa o visual especial
    iniciarTemporizador(); // Se ele tirou o mouse de cima, recomeça a contar 15s
});

areaDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    areaDrop.classList.remove('arrastando');
    pararTemporizador(); // O upload vai começar, não esconde a tela mais!

    if (e.dataTransfer.files.length > 0) {
        const arquivo = e.dataTransfer.files[0];
        divStatus.style.display = "block";
        divStatus.innerText = "Preparando...";

        const reader = new FileReader();
        reader.onload = function (evento) {
            const base64 = evento.target.result.split(',')[1];
            chrome.runtime.sendMessage({
                acao: "fazer_upload",
                nome: arquivo.name,
                tipo: arquivo.type || "application/octet-stream",
                dados: base64
            });
            areaDrop.style.display = "none";
        };
        reader.readAsDataURL(arquivo);
    }
});