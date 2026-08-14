# task-observer (Claude Code adaptation)

Skill d'observation en arrière-plan : repère les corrections utilisateur qui se
généralisent, les workflows répétés, les manques de compétences existantes, et
les propose comme améliorations à intégrer (jamais installées silencieusement).

**Origine :** "One Skill to Rule Them All" par Eoghan Henn / [rebelytics.com](https://rebelytics.com),
adapté pour Codex par [AllstarGER](https://github.com/AllstarGER/one-skill-to-rule-them-all),
puis adapté ici pour Claude Code (CLAUDE.md au lieu de AGENTS.md, `.claude/`
au lieu de `.codex/`).

Licence : CC BY 4.0 (voir `LICENSE.txt`). Merci de conserver l'attribution en
cas de partage ou de fork.

## Utilisation

Voir `SKILL.md` pour le comportement détaillé. En résumé :

```bash
# initialiser la mémoire globale (une fois)
python3 .claude/skills/task-observer/scripts/task_observer.py init

# lister les fichiers de contexte à lire
python3 .claude/skills/task-observer/scripts/task_observer.py context --cwd "$PWD"

# voir le compte des observations
python3 .claude/skills/task-observer/scripts/task_observer.py status
```

La mémoire (log d'observations, principes transverses) vit hors du dépôt,
dans `~/.claude/memories/task-observer/`, pour persister entre projets.
