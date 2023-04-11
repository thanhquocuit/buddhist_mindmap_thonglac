import { TreeNode } from "./mm";

export interface MediaURL {
    title: string
    playURL: string
    content?: string
}

export interface ExtTreeNode extends TreeNode {
    description?: string
    playlist?: MediaURL[]
}

export function generate(title: string): ExtTreeNode {
    return {
        id: "root",
        text: title,
        display: { block: true },
        nodes: []
    }
}

export function data(): ExtTreeNode {
    return {
        id: "root",
        text: "Pháp Hành",
        display: { block: true },
        nodes: [
            {
                text: "Dolor sit amet",
                nodes: [
                    {
                        text: "Consectetur adipiscing elit, sed do eiusmod",
                    },
                    {
                        text: "Tempor incididunt ut labore",
                    },
                ],
            },
            {
                text: 'Hộ Trì Chơn Lý',
            }
        ],
        description: 'This is a simple description',
        playlist: [
            {
                title: 'Test video',
                playURL: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
                content: 'Youtube description'
            }
        ]
    }
}