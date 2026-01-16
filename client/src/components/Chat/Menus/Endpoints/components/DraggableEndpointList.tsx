import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier, XYCoord } from 'dnd-core';
import type { Endpoint } from '~/common';
import { EndpointModelItem } from './EndpointModelItem';

interface DragItem {
    index: number;
    id: string;
    type: string;
}

interface DraggableItemProps {
    id: string;
    index: number;
    moveItem: (dragIndex: number, hoverIndex: number) => void;
    onDrop: () => void;
    endpoint: Endpoint;
    modelId: string;
    isSelected: boolean;
}

const ItemTypes = {
    AGENT: 'agent',
};

const DraggableItem: React.FC<DraggableItemProps> = ({
    id,
    index,
    moveItem,
    onDrop,
    endpoint,
    modelId,
    isSelected,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
        accept: ItemTypes.AGENT,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            };
        },
        hover(item: DragItem, monitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;

            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }

            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();

            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

            // Determine mouse position
            const clientOffset = monitor.getClientOffset();

            // Get pixels to the top
            const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%

            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }

            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }

            // Time to actually perform the action
            moveItem(dragIndex, hoverIndex);

            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex;
        },
        drop() {
            onDrop();
        }
    });

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.AGENT,
        item: () => {
            return { id, index };
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    return (
        <EndpointModelItem
            ref={ref}
            modelId={modelId}
            endpoint={endpoint}
            isSelected={isSelected}
            style={{ opacity }}
            data-handler-id={handlerId}
            className="w-full cursor-move"
        />
    );
};

interface DraggableEndpointListProps {
    endpoint: Endpoint;
    models: Array<{ name: string; isGlobal?: boolean; order?: number }>;
    selectedModel: string | null;
    onReorder: (newOrder: string[]) => void;
}

export const DraggableEndpointList: React.FC<DraggableEndpointListProps> = ({
    endpoint,
    models,
    selectedModel,
    onReorder,
}) => {
    const [items, setItems] = React.useState(models);

    React.useEffect(() => {
        setItems(models);
    }, [models]);

    const moveItem = React.useCallback(
        (dragIndex: number, hoverIndex: number) => {
            setItems((prevItems) => {
                const newItems = [...prevItems];
                const [movedItem] = newItems.splice(dragIndex, 1);
                newItems.splice(hoverIndex, 0, movedItem);
                return newItems;
            });
        },
        [],
    );

    const handleDrop = React.useCallback(() => {
        const newOrderIds = items.map(item => item.name);
        onReorder(newOrderIds);
    }, [items, onReorder]);

    // If we are dragging, we use the local state 'items'.
    // If not, we might fall back to props 'models' if needed, but 'useEffect' syncs them.
    // Actually, dragging updates 'items' immediately.

    return (
        <div>
            {items.map((model, index) => (
                <DraggableItem
                    key={model.name}
                    id={model.name}
                    index={index}
                    modelId={model.name}
                    endpoint={endpoint}
                    isSelected={selectedModel === model.name}
                    moveItem={moveItem}
                    onDrop={handleDrop}
                />
            ))}
        </div>
    );
};
