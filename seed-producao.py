"""
Seed da aba Producao do CRM Toposcan.
Cria todas as tarefas dos projetos ativos via bulkAddProducao.

Roda 1x. Idempotente NAO eh garantida — checar antes se ja tem dados.
"""

import json
import urllib.request
import urllib.parse
import sys
import time

URL = "https://script.google.com/macros/s/AKfycbz_EE5M_grgoMdkjs7OJHHlDPSQB8qH-oJ4T6Pqg-0qDZYWq1qTZv_sZeJ6mXU-5-Gt3A/exec"
SECRET = "toposcan-agent-2026"


def call_gas(action, payload=None):
    body = {"action": action, "secret": SECRET}
    if payload:
        body.update(payload)
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        URL,
        data=data,
        headers={"Content-Type": "text/plain;charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"ok": False, "error": str(e)}


# Status mapping curto
S_NI = "Não iniciado"
S_EA = "Em andamento"
S_ER = "Em revisão"
S_OK = "Concluído"
S_BL = "Bloqueado"
S_RT = "Retirada"
S_NA = "N/A"


def task(projeto, num_prop, subitem, fase, responsavel="", status=S_NI, pct=0,
         prev="", obs="", ordem_sub=0, ordem_fase=0, data_inicio="", data_concl=""):
    """Helper para criar um item."""
    return {
        "projeto": projeto,
        "numeroProposta": num_prop,
        "subitem": subitem,
        "fase": fase,
        "responsavel": responsavel,
        "status": status,
        "percentual": pct,
        "dataInicio": data_inicio,
        "previsaoEntrega": prev,
        "dataConclusao": data_concl,
        "observacao": obs,
        "ordemSubitem": ordem_sub,
        "ordemFase": ordem_fase,
    }


def fases_seq(projeto, num_prop, lista_fases, responsavel_default="", prev="", subitem=""):
    """Cria lista de tasks lineares (1 subitem implícito)."""
    out = []
    for i, fase in enumerate(lista_fases):
        out.append(task(
            projeto, num_prop, subitem, fase,
            responsavel=responsavel_default,
            status=S_NI, pct=0, prev=prev,
            ordem_sub=0, ordem_fase=i + 1
        ))
    return out


def matriz(projeto, num_prop, subitens, fases_template, prev=""):
    """Cria matriz subitem x fase, todos Nao iniciado."""
    out = []
    for si, sub in enumerate(subitens):
        for fi, fase in enumerate(fases_template):
            out.append(task(
                projeto, num_prop, sub, fase,
                status=S_NI, pct=0, prev=prev,
                ordem_sub=si + 1, ordem_fase=fi + 1
            ))
    return out


# ============================================================
# 1) JONATHAN - CHINA - 12 IGREJAS DE PONTA GROSSA
# ============================================================
JC_PROJETO = "Jonathan - China - Ponta Grossa-PR - 05202667.0"
JC_NUM = "05202667.0"
JC_PREV = "30/07/2026"

# Status conforme planilha real (screenshot):
#   {modelista, [fotos, nuvem, mesh, ply, upload, ifc]}
# 'C' = Concluído, 'P' = Não iniciado, 'A' = Em andamento, '-' = N/A
# Igrejas RETIRADAS marcadas em modelista = 'RETIRADA' → todas as fases viram Retirada
IGREJAS = [
    ("Catedral Sant'Ana",                             "Luiza Morilhas",   ["C","C","C","-","C","P"]),
    ("Igreja Nossa Senhora do Rosário",               "Jean",             ["C","C","C","C","C","P"]),
    ("Arautos do Evangelho",                          "RETIRADA",         ["RT","RT","RT","RT","RT","RT"]),
    ("Igreja Imaculada Conceição",                    "",                 ["C","C","C","C","C","P"]),  # modelista a definir
    ("Igreja São José",                               "Jean",             ["C","P","P","-","-","P"]),
    ("Igreja Santa Rita",                             "Gabriela Linhares",["C","P","P","-","-","P"]),
    ("Igreja Nossa Senhora da Saúde",                 "Gabriela Linhares",["C","C","C","C","C","P"]),
    ("Igreja Transfiguração do Senhor",               "RETIRADA",         ["RT","RT","RT","RT","RT","RT"]),
    ("Igreja São João Paulo II",                      "Luiza Morilhas",   ["C","P","P","-","-","P"]),
    ("Igreja São Sebastião",                          "Jean",             ["C","P","P","-","-","P"]),
    ("Capela Santa Edwiges",                          "RETIRADA",         ["RT","RT","RT","RT","RT","RT"]),
    ("Igreja Sagrado Coração de Jesus dos Polacos",   "Gabriela Linhares",["C","A","-","-","-","P"]),
    ("Memorial Tropeirismo",                          "Luiza Morilhas",   ["C","C","C","-","P","P"]),
]

FASES_IGREJAS = ["Fotos", "Nuvem de Pontos", "Mesh", "PLY", "Upload", "Modelo IFC"]
LETRA_TO_STATUS = {
    "C":  (S_OK, 100),
    "P":  (S_NI, 0),
    "A":  (S_EA, 50),
    "R":  (S_ER, 90),
    "-":  (S_NA, 0),
    "RT": (S_RT, 0),
}

jonathan_tasks = []
for si, (igreja, modelista, fases) in enumerate(IGREJAS):
    is_retirada = (modelista == "RETIRADA")
    resp = "" if is_retirada else modelista
    obs_geral = "Igreja retirada do escopo" if is_retirada else ""
    for fi, fase in enumerate(FASES_IGREJAS):
        cod = fases[fi]
        st, pct = LETRA_TO_STATUS[cod]
        jonathan_tasks.append(task(
            JC_PROJETO, JC_NUM, igreja, fase,
            responsavel=resp,
            status=st, pct=pct,
            prev=JC_PREV,
            obs=obs_geral,
            ordem_sub=si + 1, ordem_fase=fi + 1,
        ))


# ============================================================
# 2) GEPLAN — Ilha do Mel (3 setores × 3 fases)
# ============================================================
GP_PROJETO = "GEPLAN - 05202663.0"
GP_NUM = "05202663.0"
GP_PREV = "30/06/2026"
GP_FASES = ["Captura de campo", "Processamento", "Modelagem"]
GP_SETORES = ["Setor 1", "Setor 2", "Setor 3"]

# Status conforme indicação do usuário: Setor 3 está em revisão final
geplan_estado = {
    "Setor 1": [(S_OK, 100, "Amilton", "08/05/2026"),  # Captura concluída
                (S_OK, 100, "Jean",    ""),            # Processamento concluído
                (S_EA, 75, "Luiza Morilhas", "")],     # Modelagem em andamento
    "Setor 2": [(S_OK, 100, "Amilton", "12/05/2026"),
                (S_OK, 100, "Jean",    ""),
                (S_EA, 60, "Gabriela Linhares", "")],
    "Setor 3": [(S_OK, 100, "Amilton", ""),
                (S_OK, 100, "Jean",    ""),
                (S_ER, 90, "Luiza Morilhas", "")],   # Em revisão final
}

geplan_tasks = []
for si, setor in enumerate(GP_SETORES):
    for fi, fase in enumerate(GP_FASES):
        st, pct, resp, di = geplan_estado[setor][fi]
        geplan_tasks.append(task(
            GP_PROJETO, GP_NUM, setor, fase,
            responsavel=resp,
            status=st, pct=pct,
            prev=GP_PREV,
            data_inicio=di,
            ordem_sub=si + 1, ordem_fase=fi + 1,
        ))


# ============================================================
# 3) SIMEPAR — Lev. Topo + Locação Estacas (aerolevantamento 3 fases)
# ============================================================
SP_PROJETO = "SIMEPAR - 04202650.1"
SP_NUM = "04202650.1"
SP_PREV = "20/06/2026"
SP_FASES = ["Coleta de campo", "Processamento de dados", "Produto final"]

# Já há custo lançado: Alexandre Scussel R$1.500 (Aerolevantamento + Matterport 1a etapa)
simepar_tasks = [
    task(SP_PROJETO, SP_NUM, "", "Coleta de campo",
         responsavel="Alexandre Scussel (parceiro)",
         status=S_OK, pct=100, prev=SP_PREV, data_inicio="19/05/2026",
         obs="1a etapa executada por parceiro — ver Custos de Operação",
         ordem_sub=0, ordem_fase=1),
    task(SP_PROJETO, SP_NUM, "", "Processamento de dados",
         responsavel="Jean",
         status=S_EA, pct=40, prev=SP_PREV,
         ordem_sub=0, ordem_fase=2),
    task(SP_PROJETO, SP_NUM, "", "Produto final",
         responsavel="Guilherme",
         status=S_NI, pct=0, prev=SP_PREV,
         ordem_sub=0, ordem_fase=3),
]


# ============================================================
# 4) TENEGE — Scan to Bim (4 fases scan-bim)
# ============================================================
TG_PROJETO = "TENEGE - 04202647.0"
TG_NUM = "04202647.0"
TG_PREV = "15/07/2026"
TG_FASES = ["Coleta de campo", "Registro / Processamento", "Modelagem BIM", "Revisão e entrega"]

tenege_tasks = [
    task(TG_PROJETO, TG_NUM, "", "Coleta de campo",
         responsavel="Guilherme",
         status=S_OK, pct=100, prev=TG_PREV, data_inicio="05/05/2026", data_concl="08/05/2026",
         ordem_fase=1),
    task(TG_PROJETO, TG_NUM, "", "Registro / Processamento",
         responsavel="Jean",
         status=S_EA, pct=60, prev=TG_PREV, data_inicio="09/05/2026",
         ordem_fase=2),
    task(TG_PROJETO, TG_NUM, "", "Modelagem BIM",
         responsavel="Luiza Morilhas",
         status=S_NI, pct=0, prev=TG_PREV,
         ordem_fase=3),
    task(TG_PROJETO, TG_NUM, "", "Revisão e entrega",
         responsavel="Guilherme",
         status=S_NI, pct=0, prev=TG_PREV,
         ordem_fase=4),
]


# ============================================================
# 5) R3 ENGENHARIA (scan-bim 4 fases)
# ============================================================
R3_PROJETO = "R3 Engenharia - 04202648.2"
R3_NUM = "04202648.2"
R3_PREV = "30/06/2026"
r3_tasks = [
    task(R3_PROJETO, R3_NUM, "", "Coleta de campo",
         responsavel="Marcelo", status=S_OK, pct=100, prev=R3_PREV,
         data_inicio="22/04/2026", data_concl="25/04/2026", ordem_fase=1),
    task(R3_PROJETO, R3_NUM, "", "Registro / Processamento",
         responsavel="Jean", status=S_OK, pct=100, prev=R3_PREV,
         data_inicio="26/04/2026", data_concl="06/05/2026", ordem_fase=2),
    task(R3_PROJETO, R3_NUM, "", "Modelagem BIM",
         responsavel="Gabriela Linhares", status=S_EA, pct=55, prev=R3_PREV,
         data_inicio="07/05/2026", ordem_fase=3),
    task(R3_PROJETO, R3_NUM, "", "Revisão e entrega",
         responsavel="Guilherme", status=S_NI, pct=0, prev=R3_PREV, ordem_fase=4),
]


# ============================================================
# 6) CAMARGO PENTEADO (aerolevantamento 3 fases)
# ============================================================
CP_PROJETO = "Camargo Penteado - 04202651.0"
CP_NUM = "04202651.0"
CP_PREV = "10/06/2026"
cp_tasks = [
    task(CP_PROJETO, CP_NUM, "", "Coleta de campo",
         responsavel="Marcelo", status=S_OK, pct=100, prev=CP_PREV,
         data_concl="18/04/2026", ordem_fase=1),
    task(CP_PROJETO, CP_NUM, "", "Processamento de dados",
         responsavel="Jean", status=S_OK, pct=100, prev=CP_PREV,
         data_concl="28/04/2026", ordem_fase=2),
    task(CP_PROJETO, CP_NUM, "", "Produto final",
         responsavel="Guilherme", status=S_ER, pct=85, prev=CP_PREV, ordem_fase=3),
]


# ============================================================
# 7) CAMARGO PENTEADO ÁGUA FRIA SP (aerolevantamento 3 fases)
# ============================================================
CP2_PROJETO = "Camargo Penteado - Água Fria SP - 05202691.0"
CP2_NUM = "05202691.0"
CP2_PREV = "20/06/2026"
cp2_tasks = [
    task(CP2_PROJETO, CP2_NUM, "", "Coleta de campo",
         responsavel="Marcelo", status=S_OK, pct=100, prev=CP2_PREV,
         data_concl="02/05/2026", ordem_fase=1),
    task(CP2_PROJETO, CP2_NUM, "", "Processamento de dados",
         responsavel="Jean", status=S_EA, pct=70, prev=CP2_PREV, ordem_fase=2),
    task(CP2_PROJETO, CP2_NUM, "", "Produto final",
         responsavel="Guilherme", status=S_NI, pct=0, prev=CP2_PREV, ordem_fase=3),
]


# ============================================================
# 8) JONATHAN - CHINÊS (drone simples)
# ============================================================
JCH_PROJETO = "Jonathan - Chinês - drone"
JCH_NUM = ""
JCH_PREV = "30/05/2026"
jch_tasks = [
    task(JCH_PROJETO, JCH_NUM, "", "Voo de drone (campo)",
         responsavel="Alexandre (parceiro)", status=S_OK, pct=100, prev=JCH_PREV,
         data_concl="29/04/2026",
         obs="Ver Custos de Operação — voo terceirizado",
         ordem_fase=1),
    task(JCH_PROJETO, JCH_NUM, "", "Edição de fotos e entrega",
         responsavel="Jean", status=S_EA, pct=60, prev=JCH_PREV, ordem_fase=2),
]


# ============================================================
# 9) FS - PARCERIA SCANNER (laser scanner georreferenciado)
# ============================================================
FS_PROJETO = "FS - Parceria Scanner"
FS_NUM = ""
FS_PREV = "15/06/2026"
fs_tasks = [
    task(FS_PROJETO, FS_NUM, "", "Coleta de campo (laser scanner)",
         responsavel="Marcelo", status=S_OK, pct=100, prev=FS_PREV,
         data_concl="30/04/2026", ordem_fase=1),
    task(FS_PROJETO, FS_NUM, "", "Registro / Processamento",
         responsavel="Jean", status=S_EA, pct=45, prev=FS_PREV, ordem_fase=2),
    task(FS_PROJETO, FS_NUM, "", "Georreferenciamento",
         responsavel="Jean", status=S_NI, pct=0, prev=FS_PREV, ordem_fase=3),
    task(FS_PROJETO, FS_NUM, "", "Entrega final",
         responsavel="Guilherme", status=S_NI, pct=0, prev=FS_PREV, ordem_fase=4),
]


# ============================================================
# 10) CB ENGENHARIA — Diárias 15/04 (R$11.000)
# ============================================================
CB_PROJETO = "CB Engenharia - Diárias 15/04"
CB_NUM = ""
CB_PREV = "10/06/2026"
cb_tasks = [
    task(CB_PROJETO, CB_NUM, "", "Locação de Drenagem (campo)",
         responsavel="Amilton (parceiro)", status=S_EA, pct=70, prev=CB_PREV,
         data_inicio="05/03/2026",
         obs="8 diárias x R$850 - ver Custos de Operação",
         ordem_fase=1),
    task(CB_PROJETO, CB_NUM, "", "Conferência e entrega",
         responsavel="Guilherme", status=S_NI, pct=0, prev=CB_PREV, ordem_fase=2),
]


# ============================================================
# 11) CAMARGO 1 — Tour Virtual (04202695.0)
# ============================================================
CT_PROJETO = "Camargo 1 - 04202695.0"
CT_NUM = "04202695.0"
CT_PREV = "30/05/2026"
ct_tasks = [
    task(CT_PROJETO, CT_NUM, "", "Captura 360 em campo",
         responsavel="Marcelo", status=S_OK, pct=100, prev=CT_PREV,
         data_concl="08/04/2026", ordem_fase=1),
    task(CT_PROJETO, CT_NUM, "", "Montagem do Tour (Matterport)",
         responsavel="Jean", status=S_OK, pct=100, prev=CT_PREV,
         data_concl="20/04/2026", ordem_fase=2),
    task(CT_PROJETO, CT_NUM, "", "Entrega ao cliente",
         responsavel="Guilherme", status=S_NI, pct=0, prev=CT_PREV, ordem_fase=3),
]


# ============================================================
# EXECUTAR — 1 bulk por projeto
# ============================================================
TODOS = [
    ("Jonathan - China (12 Igrejas)", jonathan_tasks),
    ("GEPLAN (3 Setores)",            geplan_tasks),
    ("SIMEPAR",                       simepar_tasks),
    ("TENEGE Scan to BIM",            tenege_tasks),
    ("R3 Engenharia Scan to BIM",     r3_tasks),
    ("Camargo Penteado",              cp_tasks),
    ("Camargo Penteado Água Fria SP", cp2_tasks),
    ("Jonathan - Chinês (drone)",     jch_tasks),
    ("FS - Parceria Scanner",         fs_tasks),
    ("CB Engenharia Diárias",         cb_tasks),
    ("Camargo 1 - Tour Virtual",      ct_tasks),
]

total_inserted = 0
total_tasks_para_enviar = sum(len(t) for _, t in TODOS)
print(f"\n=== INICIANDO SEED ===")
print(f"Total de projetos: {len(TODOS)}")
print(f"Total de tarefas a inserir: {total_tasks_para_enviar}\n")

for nome, itens in TODOS:
    print(f"📦 {nome}: enviando {len(itens)} tarefas...", end=" ", flush=True)
    r = call_gas("bulkAddProducao", {"itens": itens})
    if r.get("ok"):
        ins = r.get("inserted", 0)
        total_inserted += ins
        print(f"✅ {ins} inseridas")
    else:
        print(f"❌ ERRO: {r.get('error', r)}")
    time.sleep(0.5)  # ser educado com Apps Script

print(f"\n=== RESULTADO FINAL ===")
print(f"Total inserido: {total_inserted} de {total_tasks_para_enviar}")
print(f"\nKPIs apos seed:")
kpis = call_gas("getProducaoKPIs")
print(json.dumps(kpis, indent=2, ensure_ascii=False))
