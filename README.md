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

## Interface Photoshop améliorée
- Barre d'outils verticale compacte, inspirée de la disposition de Photopea.
- Barre de menus et options plus denses, espace de travail central et panneau droit avec onglets Calques/Réglages/Filtres/Historique.
- Les outils marqués d'un astérisque et grisés sont volontairement désactivés : ils ne sont pas encore implémentés.

## Limites explicites
Ce projet n'est pas un clone complet de Photopea ou Adobe Photoshop. Les outils avancés tels que masques de fusion complets, sélection intelligente, plume Bézier, styles de calque, Camera Raw, objets dynamiques, gestion ICC et IA générative ne sont pas intégralement implémentés. Les contrôles disponibles ne doivent pas être interprétés comme une compatibilité PSD complète.

Les bibliothèques PDF.js et pdf-lib sont chargées depuis des CDN pour les fonctions PDF; les fonctionnalités image de base fonctionnent localement dans le navigateur.


## PhotoFree Photoshop — état de cette version

Cette version enrichit l'éditeur web local avec une disposition inspirée des éditeurs professionnels, des panneaux Calques / Canaux / Tracés / Historique, ainsi que les outils de base : pinceau, gomme, texte raster, pipette, recadrage, sélection rectangulaire/elliptique, lasso de sélection, formes, ligne, dégradé et remplissage de calque. Les sélections rectangulaires, elliptiques et au lasso peuvent limiter le remplissage.

**Limites explicites :** il ne s'agit pas d'un clone complet de Photopea. Les canaux sont informatifs, les tracés Bézier ne sont pas éditables, la baguette magique, le tampon/correcteur, les masques complets, les objets dynamiques, la compatibilité PSD native, les profils ICC avancés et les fonctions IA ne sont pas implémentés. Les calques de texte sont rasterisés au placement. Les menus exécutent seulement les commandes indiquées dans le code.

L'application traite les images dans le navigateur. Les fonctions de base ne nécessitent pas de clé API.
