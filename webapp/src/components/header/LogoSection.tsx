import { Image, makeStyles } from '@fluentui/react-components';
import '../../index.css';

import gavinTypeLogo from '../../assets/gavin-type-logo.png';

const useClasses = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        marginRight: 'auto',
        marginTop: 'auto',
        marginBottom: 'auto',
        marginLeft: '50px',
        height: '30%',

    },
});

export const LogoSection = () => {
    const classes = useClasses();

    return (
        <div className={classes.root}>
            <Image src={gavinTypeLogo} />
        </div>
    );
};
