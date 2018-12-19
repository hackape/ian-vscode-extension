# AI Studio dev helper

In house extension to facilitate development of the AI Studio project

## 安装

```bash
# 从源码编译方式
yarn global add vsce # 需要 `vsce` cli tool

git clone git@github.com:hackape/ian-vscode-extension.git
cd ian-vscode-extension
yarn # install dependencies

vsce package # 编译, 会在项目目录下生成 `ian-vscode-extension-0.1.0.vsix`
code --install-extension ian-vscode-extension-0.1.0.vsix 
```

或者用 vscode 命令 "install from VSIX"


## 开发

用 vscode 打开本项目, 先跑一个 `yarn start`, 然后跑 vscode 命令 "Start Debugging" (默认快捷键 F5).


## License

MIT © hackape
