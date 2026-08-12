/**
 * EMJ Seguros — Receptor de cotações do site
 *
 * Planilha: https://docs.google.com/spreadsheets/d/1522a0Xk8Wg3At9-rZPBEnp8p4Wt7XjpOhqqOsyvkdag/
 *
 * Como publicar:
 * 1. Abra a planilha → Extensões → Apps Script
 * 2. Cole este arquivo inteiro, salve (Ctrl+S)
 * 3. Implantar → Nova implantação → Aplicativo da Web
 *    - Executar como: Eu
 *    - Quem tem acesso: Qualquer pessoa
 * 4. Copie a URL /exec e cole em script.js → CONFIG.googleScriptURL
 * 5. Na primeira execução, autorize permissões (planilha + e-mail)
 */

const SPREADSHEET_ID = '1522a0Xk8Wg3At9-rZPBEnp8p4Wt7XjpOhqqOsyvkdag';
const EMAIL_DESTINO = 'atendimento@emjseguros.com.br';

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Data/Hora', 'Nome', 'Telefone', 'E-mail', 'Produto', 'Mensagem']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    }

    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.timestamp,
      data.nome,
      data.telefone,
      data.email,
      data.produto,
      data.mensagem || '',
    ]);

    enviarEmail(data);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'erro', msg: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'online', servico: 'EMJ Cotações' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function enviarEmail(data) {
  if (!data || !data.nome) {
    throw new Error('Dados do formulário ausentes. Use testeManual() para testar, ou envie pelo site.');
  }

  const assunto = '🔔 Nova cotação: ' + data.produto + ' — ' + data.nome;
  const telefoneWA = '55' + String(data.telefone).replace(/\D/g, '');
  const msgWA = 'Olá ' + data.nome + ', recebi sua solicitação de cotação de ' + data.produto + ' e já estou preparando a melhor proposta para você!';

  const corpo =
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">' +
      '<div style="background:#003876;padding:24px 32px;border-radius:8px 8px 0 0;">' +
        '<h2 style="color:#fff;margin:0;font-size:20px;">Nova solicitação de cotação</h2>' +
        '<p style="color:#93c5fd;margin:4px 0 0;font-size:14px;">EMJ Seguros — Sistema de Cotações</p>' +
      '</div>' +
      '<div style="background:#f4f7fb;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          linhaTabela('Data/Hora', data.timestamp) +
          linhaTabela('Nome', data.nome) +
          linhaTabela('Telefone', data.telefone) +
          linhaTabela('E-mail', data.email) +
          '<tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#5a6578;font-size:14px;"><strong>Produto</strong></td>' +
          '<td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;">' +
          '<span style="background:#003876;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:bold;">' + data.produto + '</span></td></tr>' +
          linhaTabela('Mensagem', data.mensagem || '<em style="color:#aaa;">Não informada</em>', true) +
        '</table>' +
        '<div style="margin-top:28px;text-align:center;">' +
          '<a href="https://wa.me/' + telefoneWA + '?text=' + encodeURIComponent(msgWA) + '" ' +
          'style="background:#25d366;color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">' +
          '📲 Atendimento via WhatsApp</a>' +
        '</div>' +
      '</div>' +
    '</div>';

  MailApp.sendEmail({
    to: EMAIL_DESTINO,
    subject: assunto,
    htmlBody: corpo,
  });
}

function linhaTabela(label, valor, ultima) {
  const borda = ultima ? '' : 'border-bottom:1px solid #e2e8f0;';
  return '<tr>' +
    '<td style="padding:10px 0;' + borda + 'color:#5a6578;font-size:14px;width:35%;"><strong>' + label + '</strong></td>' +
    '<td style="padding:10px 0;' + borda + 'color:#1a2332;font-size:14px;">' + valor + '</td>' +
  '</tr>';
}

/** Rode manualmente no editor para testar e-mail + planilha sem usar o site. */
function testeManual() {
  const dadosFake = {
    timestamp: new Date().toLocaleString('pt-BR'),
    nome: 'Teste EMJ',
    telefone: '(11) 99999-9999',
    email: 'teste@exemplo.com',
    produto: 'Seguro Automóvel',
    mensagem: 'Disparo de teste manual.',
  };

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  sheet.appendRow([
    dadosFake.timestamp,
    dadosFake.nome,
    dadosFake.telefone,
    dadosFake.email,
    dadosFake.produto,
    dadosFake.mensagem,
  ]);
  enviarEmail(dadosFake);
}
