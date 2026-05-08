// Nome da pasta onde os arquivos serão salvos no seu Drive
const NOME_DA_PASTA_DESTINO = "Exportações PMI";

// ======================================================================
// 1. MONITORAMENTO TOTAL DE DOWNLOADS
// ======================================================================
// Removemos os filtros. Agora, QUALQUER download ativará o botão na tela.
chrome.downloads.onCreated.addListener((downloadItem) => {

    // Procura a aba que você está usando e manda a ordem de aparecer
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { acao: "mostrar_icone" });
        }
    });
});

// ======================================================================
// 2. RECEBIMENTO E UPLOAD PARA O DRIVE
// ======================================================================
chrome.runtime.onMessage.addListener((mensagem, sender) => {
    if (mensagem.acao === "fazer_upload") {
        enviarParaDrive(mensagem, sender.tab.id);
    }
});

async function enviarParaDrive(arquivoInfo, tabId) {
    function atualizarTela(texto, sucesso = false, link = null) {
        chrome.tabs.sendMessage(tabId, { acao: "status_upload", texto: texto, sucesso: sucesso, link: link });
    }

    atualizarTela("Conectando ao Google...");

    chrome.identity.getAuthToken({ interactive: true }, async function (token) {
        if (chrome.runtime.lastError) {
            atualizarTela("Erro de autenticação.");
            return;
        }

        try {
            atualizarTela("Organizando pastas...");
            const folderId = await obterOuCriarPasta(token, NOME_DA_PASTA_DESTINO);

            atualizarTela("Enviando arquivo...");
            const respostaBinaria = await fetch(`data:${arquivoInfo.tipo};base64,${arquivoInfo.dados}`);
            const pacoteBinario = await respostaBinaria.blob();

            const respostaUpload = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=media", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": arquivoInfo.tipo
                },
                body: pacoteBinario
            });

            const dadosDoGoogle = await respostaUpload.json();

            if (dadosDoGoogle.id) {
                atualizarTela("Finalizando...");

                await fetch(`https://www.googleapis.com/drive/v3/files/${dadosDoGoogle.id}?addParents=${folderId}`, {
                    method: "PATCH",
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: arquivoInfo.nome
                    })
                });

                // Montamos o link oficial do arquivo no Drive e enviamos para a tela
                const linkArquivo = `https://drive.google.com/file/d/${dadosDoGoogle.id}/view`;
                atualizarTela(`✅ Salvo na pasta PMI!`, true, linkArquivo);
            }
        } catch (erro) {
            console.error(erro);
            atualizarTela("Erro no processo.");
        }
    });
}

// ======================================================================
// 3. FUNÇÃO AUXILIAR: GERENCIAR PASTAS
// ======================================================================
async function obterOuCriarPasta(token, nomePasta) {
    const busca = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${nomePasta}' and mimeType='application/vnd.google-apps.folder' and trashed=false`, {
        headers: { "Authorization": "Bearer " + token }
    });
    const resultadoBusca = await busca.json();

    if (resultadoBusca.files && resultadoBusca.files.length > 0) {
        return resultadoBusca.files[0].id;
    }

    const criacao = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: nomePasta,
            mimeType: "application/vnd.google-apps.folder"
        })
    });
    const novaPasta = await criacao.json();
    return novaPasta.id;
}