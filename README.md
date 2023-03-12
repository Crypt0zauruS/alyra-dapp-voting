# NextJs Voting dApp

Bonjour cher correcteur,
Cette dApp est une application de vote en ligne basée sur le smart contract de vote de notre formation.
Nous avons utilisé **Truffle** pour le développement, le test et le déploiement du smart contract, ainsi que **NextJs** pour le développement de l'interface utilisateur avec la librairie **ethers**

## Installation

- Cloner le dépôt gitHub
- Installer les dépendances dans les 2 dossiers (truffle et voting)

```sh
# A faire dans le dossier truffle et dans le dossier voting
$ npm install

```

### Dans le dossier truffle:

- Renommer le fichier .env-sample en .env puis renseigner votre clée privée ainsi que l'URL de votre noeud Goerli (Infura, Alchemy, Quicknode,...)

- Assurez-vous que vous possédez des faucet Goerli

- Procédez à la compilation puis au déploiement du contrat de vote sur Goerli avec cette commande:

```sh

$ truffle migrate --network goerli
```

## Test du contrat de vote

- si vous voulez tester le contrat, un fichier de test est bien présent.
- Lancer **Ganache** et assurez-vous que le port soit bien **8545**
- procéder au test avec la commande

```sh

$ npm test
```

## Utilisation de l'application

### Dans le dossier voting:

- Lancer l'application:

```sh
$ npm run dev
```

- Rendez vous dans votre navigateur à l'adresse **localhost:3000**

- Enjoy !

- Si vous voulez déployer l'application sur une plateforme telle que netlify ou vercel, assurez-vous que le dossier de build est bien le dossier **voting** et non le dossier truffle ou le dossier racine.

## Utilisation immédiate

- Si vous voulez juste voir notre travail sans manipulations, rendez-vous sur le lien suivant :
  https://voting-dapp-nextjs.vercel.app/
- L'application vous y attend déjà avec un contrat de vote déployé sur Goerli.
- Il faudra nous contacter en nous envoyant votre adresse Goerli pour que nous puissions vous transférer le ownership du contrat de vote.
