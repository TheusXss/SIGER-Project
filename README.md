# React + Vite

<<<<<<< HEAD
=======
## Aulas Extras no plano Spark

O fluxo de Aulas Extras usa transações do Cloud Firestore e regras de segurança; não depende de Cloud Functions nem do plano Blaze. Para publicar as regras no projeto Firebase configurado na aplicação, use o Firebase CLI:

```sh
firebase deploy --only firestore:rules --project <ID_DO_PROJETO>
```

Cada solicitação pode selecionar até 8 turmas. Esse limite permite que as regras do Firestore validem individualmente os documentos de turma existentes, junto com a identidade institucional do professor.

>>>>>>> 4fcfbac (atualização geral)
This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
