# Automacao Unreal Engine 5 - Rafaela
# Guia de Integracao e Automacao

## Status: EM DESENVOLVIMENTO

## Opcoes de Automacao UE5

### 1. UnrealEditor-Cmd.exe (JA INSTALADO)
Local: `C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor-Cmd.exe`

Uso basico:
```bash
UnrealEditor-Cmd.exe "Caminho\Projeto.uproject" -RunPythonCommand "print('Hello')"
```

### 2. Python API (NATIVO desde UE 4.23)
O Unreal tem Python built-in mas precisa ser habilitado.

### 3. Commandlets
Build,Cook,Package diretamente via CLI.

### 4. Unreal Automation Tool (UAT)
Para testes e build automation.

## Tarefas do Projeto Guaratuba
- [ ] Melhorar agua (texturas, shaders)
- [ ] Melhorar areia (texturas realista)
- [ ] Melhorar grama (foliage)
- [ ] Melhorar iluminacao (dia/noite)

## Proximo Passo
Testar UnrealEditor-Cmd com o projeto Guaratuba
