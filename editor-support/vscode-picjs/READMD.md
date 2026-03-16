Option 1: Symlink fordevelopment

Two options for installing:

1. Symlink: best if you're making changes to these files

   * Create the VSCode extensions directory if it doesn't exist

        mkdir -p ~/.vscode/extensions


   * Symlink the extension

        ln -s "$(pwd)/vscode-picjs" ~/.vscode/extensions/picjs

    * Restart VSCode. Files with .picjs or .pikchr extensions will get syntax highlighting.

2. Package as VSIX
    * Install vsce if you don't have it
        npm install -g @vscode/vsce

    * Package the extension
        cd vscode-picjs
        vsce package

      This creates picjs-0.1.0.vsix which you can install via:

        - VSCode Command Palette → "Extensions: Install from VSIX..."
        - Or: code --install-extension picjs-0.1.0.vsix
