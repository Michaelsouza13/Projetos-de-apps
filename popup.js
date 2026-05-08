document.addEventListener('DOMContentLoaded', () => {
    const btnLogin = document.getElementById('btn-login');
    const statusCaixa = document.getElementById('status-caixa');

    // 1. Verificação invisível inicial
    chrome.identity.getAuthToken({ interactive: false }, function (token) {
        if (chrome.runtime.lastError || !token) {
            statusCaixa.textContent = "Você precisa autorizar o aplicativo para enviar arquivos.";
            statusCaixa.style.color = "#5f6368";
            btnLogin.style.display = "block";
        } else {
            statusCaixa.textContent = "✅ Conta conectada com sucesso! A extensão já está pronta para uso.";
            statusCaixa.style.color = "#0d652d";
            statusCaixa.style.backgroundColor = "#e6f4ea";
        }
    });

    // 2. Clique no botão de Fazer Login
    btnLogin.addEventListener('click', () => {
        statusCaixa.textContent = "Autenticando...";
        btnLogin.style.display = "none";

        chrome.identity.getAuthToken({ interactive: true }, function (token) {
            if (chrome.runtime.lastError) {
                // NOVIDADE: Agora o código vai imprimir o erro exato no console do popup!
                console.error("ERRO DO GOOGLE:", chrome.runtime.lastError.message);

                statusCaixa.textContent = "Login cancelado ou falhou. Tente novamente.";
                statusCaixa.style.color = "#d93025";
                statusCaixa.style.backgroundColor = "#fce8e6";
                btnLogin.style.display = "block";
            } else {
                statusCaixa.textContent = "✅ Conta conectada com sucesso! A extensão já está pronta para uso.";
                statusCaixa.style.color = "#0d652d";
                statusCaixa.style.backgroundColor = "#e6f4ea";
            }
        });
    });
});