# PhotoFree AI — version avec PhotoFree Photoshop renforcé

## Installation sur GitHub Pages
1. Téléverse `index.html`, `suite.css`, `suite.js` et `README.md` à la racine du dépôt.
2. Remplace les fichiers de même nom si GitHub le demande.
3. Valide le commit puis attends le redéploiement GitHub Pages.
4. Ouvre le site et sélectionne **Photoshop** dans la navigation PhotoFree.

## Fonctions réellement implémentées dans PhotoFree Photoshop
- Import d'image et création de document aux dimensions personnalisées.
- Calques pixel, ajout/suppression/duplication, visibilité, renommage, opacité et modes de fusion courants.
- Pinceau, gomme, formes rectangle/ellipse, texte, pipette et recadrage rectangulaire.
- Réglages de luminosité, contraste, saturation et flou.
- Filtres rapides noir et blanc, sépia, inversion, couleurs intenses, éclaircissement et contraste.
- Historique Annuler/Rétablir pour les opérations qui enregistrent un instantané.
- Zoom, export PNG/JPEG et sauvegarde/réouverture du projet `.photofree` avec ses calques.
- Traitement local dans le navigateur pour les fichiers ouverts.

## Limites explicites
Ce n'est pas une copie complète d'Adobe Photoshop. Cette version n'implémente pas encore les masques de fusion réels, la sélection intelligente, la plume vectorielle, les objets dynamiques, Camera Raw, les profils ICC, la pression du stylet, les filtres non destructifs ou l'IA générative. Les outils de texte et de forme créent des calques raster. Certains effets CSS de filtre sont appliqués au rendu global, pas en tant que calques de réglage éditables. L'application nécessite une connexion pour charger les bibliothèques externes PDF.js et pdf-lib utilisées par les espaces PDF.

## Dépendances
- PDF.js 3.11.174 (CDN) pour le rendu PDF.
- pdf-lib 1.17.1 (CDN) pour l'export PDF.
- Aucun serveur ou clé API requis pour les outils locaux de retouche.
