// Material Design icons (Google's MD set via react-icons/md), aliased to the
// icon names this codebase already uses. Each renders at ~1.15em so it slots
// into buttons, menus, tables, and dropdowns exactly like the old antd icons.
import type { ComponentProps } from 'react';
import type { IconType } from 'react-icons';
import {
    MdAdd,
    MdCancel,
    MdCheck,
    MdCheckCircle,
    MdDelete,
    MdDescription,
    MdHelp,
    MdHistory,
    MdInfo,
    MdKeyboardArrowDown,
    MdLogout,
    MdMenu,
    MdMenuOpen,
    MdNotificationsNone,
    MdPayments,
    MdPerson,
    MdPieChart,
    MdRefresh,
    MdSend,
    MdShowChart,
    MdShoppingCart,
    MdStorage,
    MdSync,
    MdTableChart,
    MdTrendingUp,
    MdWallet,
} from 'react-icons/md';

type IconProps = ComponentProps<IconType>;

function wrap(Base: IconType, name: string) {
    const Icon = (props: IconProps) => {
        const { className, style, ...rest } = props;
        return (
            <Base
                {...rest}
                className={`anticon md-icon${className ? ` ${className}` : ''}`}
                style={{
                    width: '1.15em',
                    height: '1.15em',
                    display: 'inline-block',
                    verticalAlign: '-0.18em',
                    flex: 'none',
                    ...style,
                }}
            />
        );
    };
    Icon.displayName = name;
    return Icon;
}

export const PlusOutlined = wrap(MdAdd, 'PlusOutlined');
export const AppstoreAddOutlined = wrap(MdAdd, 'AppstoreAddOutlined');
export const CheckOutlined = wrap(MdCheck, 'CheckOutlined');
export const CheckCircleOutlined = wrap(MdCheckCircle, 'CheckCircleOutlined');
export const CloseCircleOutlined = wrap(MdCancel, 'CloseCircleOutlined');
export const DeleteOutlined = wrap(MdDelete, 'DeleteOutlined');
export const FileTextOutlined = wrap(MdDescription, 'FileTextOutlined');
export const QuestionCircleOutlined = wrap(MdHelp, 'QuestionCircleOutlined');
export const HistoryOutlined = wrap(MdHistory, 'HistoryOutlined');
export const InfoCircleOutlined = wrap(MdInfo, 'InfoCircleOutlined');
export const DownOutlined = wrap(MdKeyboardArrowDown, 'DownOutlined');
export const LogoutOutlined = wrap(MdLogout, 'LogoutOutlined');
export const MenuOutlined = wrap(MdMenu, 'MenuOutlined');
export const MenuUnfoldOutlined = wrap(MdMenu, 'MenuUnfoldOutlined');
export const MenuFoldOutlined = wrap(MdMenuOpen, 'MenuFoldOutlined');
export const BellOutlined = wrap(MdNotificationsNone, 'BellOutlined');
export const DollarOutlined = wrap(MdPayments, 'DollarOutlined');
export const UserOutlined = wrap(MdPerson, 'UserOutlined');
export const PieChartOutlined = wrap(MdPieChart, 'PieChartOutlined');
export const ReloadOutlined = wrap(MdRefresh, 'ReloadOutlined');
export const SendOutlined = wrap(MdSend, 'SendOutlined');
export const LineChartOutlined = wrap(MdShowChart, 'LineChartOutlined');
export const FundOutlined = wrap(MdTrendingUp, 'FundOutlined');
export const ShoppingCartOutlined = wrap(MdShoppingCart, 'ShoppingCartOutlined');
export const DatabaseOutlined = wrap(MdStorage, 'DatabaseOutlined');
export const SyncOutlined = wrap(MdSync, 'SyncOutlined');
export const FileExcelOutlined = wrap(MdTableChart, 'FileExcelOutlined');
export const WalletOutlined = wrap(MdWallet, 'WalletOutlined');
