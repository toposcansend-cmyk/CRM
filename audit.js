// CRM Audit - 23/02/2026 18:30

const data = [
  // proposals.js data here
];

// Stats
const total = data.length;
const fechadas = data.filter(p => p.status === 'Fechada');
const pendentes = data.filter(p => p.status === 'Pendente');
const perdidas = data.filter(p => p.status === 'Perdida');
const leads = data.filter(p => p.status === 'Lead');

const totalFechado = fechadas.reduce((s, p) => s + (p.valor || 0), 0);
const totalPendente = pendentes.reduce((s, p) => s + (p.valor || 0), 0);

// Vendedores
const guilherme = data.filter(p => p.vendedor === 'Guilherme');
const marcelo = data.filter(p => p.vendedor === 'Marcelo');
const allana = data.filter(p => p.vendedor === 'Allana');
const semVendedor = data.filter(p => !p.vendedor);

console.log('=== CRM AUDIT ===');
console.log('Total propostas:', total);
console.log('Fechadas:', fechadas.length, '- R$', totalFechado.toLocaleString());
console.log('Pendentes:', pendentes.length, '- R$', totalPendente.toLocaleString());
console.log('Perdidas:', perdidas.length);
console.log('Leads:', leads.length);
console.log('');
console.log('Vendedores:');
console.log('- Guilherme:', guilherme.length);
console.log('- Marcelo:', marcelo.length);
console.log('- Allana:', allana.length);
console.log('- Sem vendedor:', semVendedor.length);
