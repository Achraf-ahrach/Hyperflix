import { useInView } from "react-intersection-observer";

interface InfiniteScrollContainerProps {
    children: React.ReactNode;
    onBottomReached: () => void; // Callback when the bottom is reached
    className?: string;
}

export default function InfiniteScrollContainer({ children, onBottomReached, className }: InfiniteScrollContainerProps) {
    const { ref } = useInView({
        rootMargin: '0px 0px 200px 0px',
        // triggerOnce: true,
        onChange: (inView) => {

            if (inView) {
                onBottomReached();
            }
        }
    });

    return <div className={className}
    >
        {children}
        <div ref={ref} />
    </div>;
}