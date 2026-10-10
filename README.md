# PhotoFree AI — suite web

## Fichiers
- `index.html` : application existante PhotoFree Studio avec les espaces Studio vidéo, PDF / Acrobat AI et Photoshop.
- `suite.css` : styles des nouveaux espaces.
- `suite.js` : navigation et fonctions PDF/image ajoutées.

## Déploiement GitHub Pages
1. Dans le dépôt GitHub, téléversez les trois fichiers à la racine.
2. Le fichier HTML doit s'appeler exactement `index.html`.
3. Gardez `suite.css` et `suite.js` dans le même dossier que `index.html`.
4. Dans Settings → Pages, choisissez `Deploy from a branch`, branche `main`, dossier `/(root)`.
5. Attendez la publication et rechargez le site.

## Dépendances chargées depuis un CDN
- PDF.js 3.11.174 pour l'affichage et l'extraction de texte PDF.
- pdf-lib 1.17.1 pour exporter les annotations ajoutées.
Une connexion Internet est nécessaire pour charger ces bibliothèques.

## Limites explicites
- L'espace Studio vidéo d'origine est conservé.
- L'espace PDF permet d'afficher les pages, d'extraire le texte des PDF textuels, d'ajouter des annotations texte et d'exporter le PDF avec ces annotations. Il ne modifie pas directement le texte déjà présent dans le PDF.
- Les fonctions locales proposées dans le panneau « Assistant IA » ne sont pas un modèle génératif. Une vraie IA nécessite un backend/API configuré ; ne publiez jamais une clé secrète dans le dépôt.
- L'espace Photoshop permet d'importer une image, régler luminosité/contraste/saturation/flou, rotation, retournement, ajouter un texte et exporter PNG/JPG. Les fonctions IA génératives, les calques avancés et l'historique complet ne sont pas implémentés.
