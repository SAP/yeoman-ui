import * as vscode from "vscode";
import * as _ from "lodash";
import { Message } from "@sap-devx/yeoman-ui-types";

const infoVSCode = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDE3IDE3Ij4NCiAgPGRlZnM+DQogICAgPGNsaXBQYXRoIGlkPSJjbGlwLWluZm9fdmNvZGUiPg0KICAgICAgPHJlY3Qgd2lkdGg9IjE3IiBoZWlnaHQ9IjE3Ii8+DQogICAgPC9jbGlwUGF0aD4NCiAgPC9kZWZzPg0KICA8ZyBpZD0iaW5mb192Y29kZSIgY2xpcC1wYXRoPSJ1cmwoI2NsaXAtaW5mb192Y29kZSkiPg0KICAgIDxnIGlkPSJHcm91cF8zNTQ0IiBkYXRhLW5hbWU9Ikdyb3VwIDM1NDQiPg0KICAgICAgPGcgaWQ9Ikdyb3VwXzM1NDMiIGRhdGEtbmFtZT0iR3JvdXAgMzU0MyI+DQogICAgICAgIDxnIGlkPSJHcm91cF8zNTQyIiBkYXRhLW5hbWU9Ikdyb3VwIDM1NDIiPg0KICAgICAgICAgIDxnIGlkPSJFbGxpcHNlXzU0IiBkYXRhLW5hbWU9IkVsbGlwc2UgNTQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzZmYmFmNyIgc3Ryb2tlLXdpZHRoPSIxLjUiPg0KICAgICAgICAgICAgPGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSI4LjUiIHN0cm9rZT0ibm9uZSIvPg0KICAgICAgICAgICAgPGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSI3Ljc1IiBmaWxsPSJub25lIi8+DQogICAgICAgICAgPC9nPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzE2NDAiIGRhdGEtbmFtZT0iUGF0aCAxNjQwIiBkPSJNMTg1Mi41LTI3NzkuNzMxdjQuNTA2IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTg0NCAyNzg3Ljc1KSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNmZiYWY3IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfMTY0MSIgZGF0YS1uYW1lPSJQYXRoIDE2NDEiIGQ9Ik0xODUyLjUtMjc3NC43MzFoMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE4NDQgMjc4MCkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzZmYmFmNyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjIiLz4NCiAgICAgICAgPC9nPg0KICAgICAgPC9nPg0KICAgIDwvZz4NCiAgPC9nPg0KPC9zdmc+DQo="

const infoTheia = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDE3IDE3Ij4NCiAgPGRlZnM+DQogICAgPGNsaXBQYXRoIGlkPSJjbGlwLWluZm9fdGhlaWEiPg0KICAgICAgPHJlY3Qgd2lkdGg9IjE3IiBoZWlnaHQ9IjE3Ii8+DQogICAgPC9jbGlwUGF0aD4NCiAgPC9kZWZzPg0KICA8ZyBpZD0iaW5mb190aGVpYSIgY2xpcC1wYXRoPSJ1cmwoI2NsaXAtaW5mb190aGVpYSkiPg0KICAgIDxnIGlkPSJHcm91cF8zNTMyIiBkYXRhLW5hbWU9Ikdyb3VwIDM1MzIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xLjEzOSAtMS4xMzkpIj4NCiAgICAgIDxwYXRoIGlkPSJJY29uX2F3ZXNvbWUtaW5mby1jaXJjbGUiIGRhdGEtbmFtZT0iSWNvbiBhd2Vzb21lLWluZm8tY2lyY2xlIiBkPSJNOS4wNjMuNTYzYTguNSw4LjUsMCwxLDAsOC41LDguNSw4LjUsOC41LDAsMCwwLTguNS04LjVabTAsMy43NzFBMS40MzksMS40MzksMCwxLDEsNy42MjQsNS43NzMsMS40MzksMS40MzksMCwwLDEsOS4wNjMsNC4zMzRabTEuOTIsOC43MDVhLjQxMS40MTEsMCwwLDEtLjQxMS40MTFINy41NTVhLjQxMS40MTEsMCwwLDEtLjQxMS0uNDExdi0uODIzYS40MTEuNDExLDAsMCwxLC40MTEtLjQxMWguNDExVjkuNjFINy41NTVBLjQxMS40MTEsMCwwLDEsNy4xNDMsOS4yVjguMzc3YS40MTEuNDExLDAsMCwxLC40MTEtLjQxMUg5Ljc0OGEuNDExLjQxMSwwLDAsMSwuNDExLjQxMVYxMS44aC40MTFhLjQxMS40MTEsMCwwLDEsLjQxMS40MTFaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjU3NiAwLjU3NikiIGZpbGw9IiM2ZmJhZjciLz4NCiAgICA8L2c+DQogIDwvZz4NCjwvc3ZnPg0K"

const warnVSCode = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDE3IDE3Ij4NCiAgPGRlZnM+DQogICAgPGNsaXBQYXRoIGlkPSJjbGlwLXdhcm5pbmdfdmNvZGUiPg0KICAgICAgPHJlY3Qgd2lkdGg9IjE3IiBoZWlnaHQ9IjE3Ii8+DQogICAgPC9jbGlwUGF0aD4NCiAgPC9kZWZzPg0KICA8ZyBpZD0id2FybmluZ192Y29kZSIgY2xpcC1wYXRoPSJ1cmwoI2NsaXAtd2FybmluZ192Y29kZSkiPg0KICAgIDxnIGlkPSJHcm91cF8zNTQxIiBkYXRhLW5hbWU9Ikdyb3VwIDM1NDEiPg0KICAgICAgPHBhdGggaWQ9ImVycm9yX2ljb24iIGQ9Ik0xNS42ODIsMTQuMDA3bC0zLjUtNi4yLTMuNS02LjJhLjQ4LjQ4LDAsMCwwLS44MzksMGwtMy41LDYuMi0zLjUsNi4yYS41LjUsMCwwLDAsMCwuNS40ODIuNDgyLDAsMCwwLC40Mi4yNDdoMTRhLjQ4Mi40ODIsMCwwLDAsLjQyLS4yNDcuNS41LDAsMCwwLDAtLjVaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjEzNCAwLjM2OSkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Q2YWYwZCIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4NCiAgICAgIDxwYXRoIGlkPSJQYXRoXzE2MzAiIGRhdGEtbmFtZT0iUGF0aCAxNjMwIiBkPSJNMTg5MS4zMjItMjc5Ny40NjJ2My4xODEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xODgzIDI4MDQuNDMxKSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDZhZjBkIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ii8+DQogICAgICA8cGF0aCBpZD0iUGF0aF8xNjMxIiBkYXRhLW5hbWU9IlBhdGggMTYzMSIgZD0iTTE4OTEuMzIyLTI3OTcuNDYyaDAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xODgzIDI4MDkuOTYyKSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDZhZjBkIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ii8+DQogICAgPC9nPg0KICA8L2c+DQo8L3N2Zz4NCg=="

const warnTheia = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDE3IDE3Ij4NCiAgPGRlZnM+DQogICAgPGNsaXBQYXRoIGlkPSJjbGlwLXdhcm5pbmdfdGhlaWEiPg0KICAgICAgPHJlY3Qgd2lkdGg9IjE3IiBoZWlnaHQ9IjE3Ii8+DQogICAgPC9jbGlwUGF0aD4NCiAgPC9kZWZzPg0KICA8ZyBpZD0id2FybmluZ190aGVpYSIgY2xpcC1wYXRoPSJ1cmwoI2NsaXAtd2FybmluZ190aGVpYSkiPg0KICAgIDxnIGlkPSJHcm91cF8zNTMzIiBkYXRhLW5hbWU9Ikdyb3VwIDM1MzMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC40MzgpIj4NCiAgICAgIDxnIGlkPSJlcnJvcl9pY29uIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDAuNTYyKSI+DQogICAgICAgIDxwYXRoIGlkPSJlcnJvcl9pY29uLTIiIGRhdGEtbmFtZT0iZXJyb3JfaWNvbiIgZD0iTTE3LjM1LDE1LjExN2wtMy44OTEtNi43NC0zLjg5LTYuNzRhLjUzOS41MzksMCwwLDAtLjkzMywwTDQuNzQ0LDguMzc3Ljg1MSwxNS4xMTdhLjUzOC41MzgsMCwwLDAsLjQ2Ny44MDhIMTYuODgzYS41MzguNTM4LDAsMCwwLC40NjctLjgwOFptLTcuMzg1LTEuNWEuODY0Ljg2NCwwLDEsMS0xLjcyOSwwdi0uMzkzYS44NjQuODY0LDAsMSwxLDEuNzI5LDBabTAtMi45NjZhLjg2NC44NjQsMCwxLDEtMS43MjksMHYtNS4xYS44NjQuODY0LDAsMSwxLDEuNzI5LDBaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMC43NzkgLTEuMzY4KSIgZmlsbD0iI2Q2YWYwZCIvPg0KICAgICAgPC9nPg0KICAgIDwvZz4NCiAgPC9nPg0KPC9zdmc+DQo="

const errorVSCodeDark = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDE3IDE3Ij4NCiAgPGRlZnM+DQogICAgPGNsaXBQYXRoIGlkPSJjbGlwLWVycm9yX3Zjb2RlX2RhcmsiPg0KICAgICAgPHJlY3Qgd2lkdGg9IjE3IiBoZWlnaHQ9IjE3Ii8+DQogICAgPC9jbGlwUGF0aD4NCiAgPC9kZWZzPg0KICA8ZyBpZD0iZXJyb3JfdmNvZGVfZGFyayIgY2xpcC1wYXRoPSJ1cmwoI2NsaXAtZXJyb3JfdmNvZGVfZGFyaykiPg0KICAgIDxnIGlkPSJHcm91cF8zNTM0IiBkYXRhLW5hbWU9Ikdyb3VwIDM1MzQiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC03NzcgLTg1MikiPg0KICAgICAgPGcgaWQ9Ikdyb3VwXzEiIGRhdGEtbmFtZT0iR3JvdXAgMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtNi43NzUpIj4NCiAgICAgICAgPGcgaWQ9Ikdyb3VwXzM1MzUiIGRhdGEtbmFtZT0iR3JvdXAgMzUzNSI+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfOCIgZGF0YS1uYW1lPSJQYXRoIDgiIGQ9Ik0zMjEzLjA2MywxODg5LjI5NGw1LjU3NSw1LjY1IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjQzMC4zMjUgLTEwMjQuNTE5KSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjU4YzgzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfOSIgZGF0YS1uYW1lPSJQYXRoIDkiIGQ9Ik0zMjE4LjcxMiwxODg5LjE2OWwtNS42NSw1LjgiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yNDMwLjUyNSAtMTAyNC4zOTQpIiBmaWxsPSJub25lIiBzdHJva2U9IiNmNThjODMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4NCiAgICAgICAgPC9nPg0KICAgICAgPC9nPg0KICAgICAgPGcgaWQ9IkVsbGlwc2VfMiIgZGF0YS1uYW1lPSJFbGxpcHNlIDIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc3NyA4NTIpIiBmaWxsPSJub25lIiBzdHJva2U9IiNmNThjODMiIHN0cm9rZS13aWR0aD0iMS41Ij4NCiAgICAgICAgPGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSI4LjUiIHN0cm9rZT0ibm9uZSIvPg0KICAgICAgICA8Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjcuNzUiIGZpbGw9Im5vbmUiLz4NCiAgICAgIDwvZz4NCiAgICA8L2c+DQogIDwvZz4NCjwvc3ZnPg0K"
const errorTheiaDark = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDE3IDE3Ij4NCiAgPGRlZnM+DQogICAgPGNsaXBQYXRoIGlkPSJjbGlwLWVycm9yX3RoZWlhX2RhcmsiPg0KICAgICAgPHJlY3Qgd2lkdGg9IjE3IiBoZWlnaHQ9IjE3Ii8+DQogICAgPC9jbGlwUGF0aD4NCiAgPC9kZWZzPg0KICA8ZyBpZD0iZXJyb3JfdGhlaWFfZGFyayIgY2xpcC1wYXRoPSJ1cmwoI2NsaXAtZXJyb3JfdGhlaWFfZGFyaykiPg0KICAgIDxnIGlkPSJHcm91cF8zNTMxIiBkYXRhLW5hbWU9Ikdyb3VwIDM1MzEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xIC0xLjAwNCkiPg0KICAgICAgPHBhdGggaWQ9IlBhdGhfMTYwOCIgZGF0YS1uYW1lPSJQYXRoIDE2MDgiIGQ9Ik0yMzAuMzUxLTEwMi40YTguNSw4LjUsMCwwLDAtOC41LDguNSw4LjUsOC41LDAsMCwwLDguNSw4LjUsOC41LDguNSwwLDAsMCw4LjUtOC41LDguNSw4LjUsMCwwLDAtOC41LTguNVptMy41NTQsMTIuMzc2YS43OTMuNzkzLDAsMCwxLS41NTkuMjI3LjguOCwwLDAsMS0uNTY3LS4yMzdsLTIuNDQtMi40NzMtMi41NTgsMi42MjdhLjc5My43OTMsMCwwLDEtLjU2Ny4yNDEuNzkzLjc5MywwLDAsMS0uNTU2LS4yMjcuNzkzLjc5MywwLDAsMS0uMjQzLS41NjEuNzkzLjc5MywwLDAsMSwuMjI4LS41NjdsMi41ODItMi42NS0yLjM2NS0yLjRhLjc5My43OTMsMCwwLDEtLjIzMS0uNTY1Ljc5My43OTMsMCwwLDEsLjIzOS0uNTYyLjc5My43OTMsMCwwLDEsLjU2NS0uMjMxLjc5My43OTMsMCwwLDEsLjU2Mi4yMzlsMi4zNDMsMi4zNzMsMi4zMDktMi4zNzFhLjc5NC43OTQsMCwwLDEsLjU2LS4yNDIuNzkzLjc5MywwLDAsMSwuNTY2LjIyNy43OTMuNzkzLDAsMCwxLC4yNDMuNTYxLjc5My43OTMsMCwwLDEtLjIyOC41NjdsLTIuMzMxLDIuMzkyLDIuNDYyLDIuNDkzYS43OTMuNzkzLDAsMCwxLC4yMjkuNTY3Ljc5My43OTMsMCwwLDEtLjI0My41NjJaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjIwLjg1MSAxMDMuNDA0KSIgZmlsbD0iI2Y1OGM4MyIvPg0KICAgIDwvZz4NCiAgPC9nPg0KPC9zdmc+DQo="

const errorVSCodeLight = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDE3IDE3Ij4NCiAgPGRlZnM+DQogICAgPGNsaXBQYXRoIGlkPSJjbGlwLWVycm9yX3Zjb2RlX2xpaGd0Ij4NCiAgICAgIDxyZWN0IHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIvPg0KICAgIDwvY2xpcFBhdGg+DQogIDwvZGVmcz4NCiAgPGcgaWQ9ImVycm9yX3Zjb2RlX2xpaGd0IiBjbGlwLXBhdGg9InVybCgjY2xpcC1lcnJvcl92Y29kZV9saWhndCkiPg0KICAgIDxnIGlkPSJHcm91cF8zNTM0IiBkYXRhLW5hbWU9Ikdyb3VwIDM1MzQiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC03NzcgLTg1MikiPg0KICAgICAgPGcgaWQ9Ikdyb3VwXzEiIGRhdGEtbmFtZT0iR3JvdXAgMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtNi43NzUpIj4NCiAgICAgICAgPGcgaWQ9Ikdyb3VwXzM1MzUiIGRhdGEtbmFtZT0iR3JvdXAgMzUzNSI+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfOCIgZGF0YS1uYW1lPSJQYXRoIDgiIGQ9Ik0zMjEzLjA2MywxODg5LjI5NGw1LjU3NSw1LjY1IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjQzMC4zMjUgLTEwMjQuNTE5KSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTg0ZDRkIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfOSIgZGF0YS1uYW1lPSJQYXRoIDkiIGQ9Ik0zMjE4LjcxMiwxODg5LjE2OWwtNS42NSw1LjgiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yNDMwLjUyNSAtMTAyNC4zOTQpIiBmaWxsPSJub25lIiBzdHJva2U9IiNlODRkNGQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4NCiAgICAgICAgPC9nPg0KICAgICAgPC9nPg0KICAgICAgPGcgaWQ9IkVsbGlwc2VfMiIgZGF0YS1uYW1lPSJFbGxpcHNlIDIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc3NyA4NTIpIiBmaWxsPSJub25lIiBzdHJva2U9IiNlODRkNGQiIHN0cm9rZS13aWR0aD0iMS41Ij4NCiAgICAgICAgPGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSI4LjUiIHN0cm9rZT0ibm9uZSIvPg0KICAgICAgICA8Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjcuNzUiIGZpbGw9Im5vbmUiLz4NCiAgICAgIDwvZz4NCiAgICA8L2c+DQogIDwvZz4NCjwvc3ZnPg0K"

const errorTheiaLight = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDE3IDE3Ij4NCiAgPGRlZnM+DQogICAgPGNsaXBQYXRoIGlkPSJjbGlwLWVycm9yX3RoZWlhX2xpZ2h0Ij4NCiAgICAgIDxyZWN0IHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIvPg0KICAgIDwvY2xpcFBhdGg+DQogIDwvZGVmcz4NCiAgPGcgaWQ9ImVycm9yX3RoZWlhX2xpZ2h0IiBjbGlwLXBhdGg9InVybCgjY2xpcC1lcnJvcl90aGVpYV9saWdodCkiPg0KICAgIDxnIGlkPSJHcm91cF8zNTMxIiBkYXRhLW5hbWU9Ikdyb3VwIDM1MzEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xIC0xLjAwNCkiPg0KICAgICAgPHBhdGggaWQ9IlBhdGhfMTYwOCIgZGF0YS1uYW1lPSJQYXRoIDE2MDgiIGQ9Ik0yMzAuMzUxLTEwMi40YTguNSw4LjUsMCwwLDAtOC41LDguNSw4LjUsOC41LDAsMCwwLDguNSw4LjUsOC41LDguNSwwLDAsMCw4LjUtOC41LDguNSw4LjUsMCwwLDAtOC41LTguNVptMy41NTQsMTIuMzc2YS43OTMuNzkzLDAsMCwxLS41NTkuMjI3LjguOCwwLDAsMS0uNTY3LS4yMzdsLTIuNDQtMi40NzMtMi41NTgsMi42MjdhLjc5My43OTMsMCwwLDEtLjU2Ny4yNDEuNzkzLjc5MywwLDAsMS0uNTU2LS4yMjcuNzkzLjc5MywwLDAsMS0uMjQzLS41NjEuNzkzLjc5MywwLDAsMSwuMjI4LS41NjdsMi41ODItMi42NS0yLjM2NS0yLjRhLjc5My43OTMsMCwwLDEtLjIzMS0uNTY1Ljc5My43OTMsMCwwLDEsLjIzOS0uNTYyLjc5My43OTMsMCwwLDEsLjU2NS0uMjMxLjc5My43OTMsMCwwLDEsLjU2Mi4yMzlsMi4zNDMsMi4zNzMsMi4zMDktMi4zNzFhLjc5NC43OTQsMCwwLDEsLjU2LS4yNDIuNzkzLjc5MywwLDAsMSwuNTY2LjIyNy43OTMuNzkzLDAsMCwxLC4yNDMuNTYxLjc5My43OTMsMCwwLDEtLjIyOC41NjdsLTIuMzMxLDIuMzkyLDIuNDYyLDIuNDkzYS43OTMuNzkzLDAsMCwxLC4yMjkuNTY3Ljc5My43OTMsMCwwLDEtLjI0My41NjJaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjIwLjg1MSAxMDMuNDA0KSIgZmlsbD0iI2U4NGQ0ZCIvPg0KICAgIDwvZz4NCiAgPC9nPg0KPC9zdmc+DQo="

export function getImage(type: Message.Type, isInBAS: boolean) {
	if (type === Message.Type.error) {
		return isInBAS ? errorTheiaDark : (_.get(vscode, "window.activeColorTheme.kind") === _.get(vscode, "ColorThemeKind.Light")) ? errorVSCodeLight : errorVSCodeDark;
	} else if (type === Message.Type.info) {
		return isInBAS ? infoTheia : infoVSCode;
	} else if (type === Message.Type.warn) {
		return isInBAS ? warnTheia : warnVSCode;
	}
}