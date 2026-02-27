declare global {
    interface Window {
        // 自定义参数
        customVariable: string;
        customMethod: () => void;
        $baseUrl: string;
        $mapJSON: string;
        $imgUrl: string;
        noc_baseIp: string;
        baseLowCodeUrl: string;
        tyLogin: string;
        tyLoginPort: string;
        tryLoginUrl: string;
        loginselect: number;
        isShowOldApp: boolean;
        Homepage: string;
        isShowExport: boolean;
        AgentName:string;
        __MICRO_APP_BASE_APPLICATION__: boolean;
        beginnerSpaceUrl: string;
    }
}

/**
 * @description 扩展ruoter-meta的类型 此处必须要export {} 不然找不到类型
 */
declare module 'vue-router' {
    interface RouteMeta {
        permission?: Array<string>
        title?: string
        icon?: string
        affix?: boolean
        hidden?: boolean
        keepAlive?: boolean
        validatePasswd?: boolean
        // 允许任意字符串键映射到string类型的值
        // [key: string]: string | undefined;
    }
}


export {}
