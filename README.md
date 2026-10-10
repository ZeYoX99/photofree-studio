# PhotoFree AI — interface Photoshop inspirée de Photopea

## Installation GitHub Pages
1. Téléversez `index.html`, `suite.css`, `suite.js` et `README.md` à la racine du dépôt.
2. Remplacez les fichiers existants quand GitHub le demande.
3. Faites **Commit changes** puis attendez la publication GitHub Pages.

## Fonctions réellement présentes dans le module Photoshop
- Import d'une image, ajout d'image comme calque, nouveau document.
- Calques raster : ajout, duplication, suppression, visibilité, renommage, opacité et modes de fusion pris en charge par Canvas.
- Pinceau, gomme, texte rasterisé, rectangle, ellipse, pipette et recadrage rectangulaire.
- Réglages de luminosité, contraste, saturation et flou, plus quelques filtres rapides.
- Annuler/rétablir sur un historique limité, zoom, export PNG/JPEG et projet PhotoFree avec calques.
- Menus Fichier, Édition, Image, Calque, Sélection, Filtre, Affichage, Texte, Fenêtre, Plus et Aide.

## Limites explicites
Ce projet n'est pas un clone complet de Photopea ou Adobe Photoshop. Les outils avancés tels que masques de fusion complets, sélection intelligente, plume Bézier, styles de calque, Camera Raw, objets dynamiques, gestion ICC et IA générative ne sont pas intégralement implémentés. Les contrôles disponibles ne doivent pas être interprétés comme une compatibilité PSD complète.

Les bibliothèques PDF.js et pdf-lib sont chargées depuis des CDN pour les fonctions PDF; les fonctionnalités image de base fonctionnent localement dans le navigateur.
